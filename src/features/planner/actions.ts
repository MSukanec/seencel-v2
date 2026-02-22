"use server";

import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
    CreateBoardInput,
    UpdateBoardInput,
    CreateListInput,
    CreateItemInput,
    UpdateItemInput,
} from "./types";

const PLANNER_PATH = '/organization/planner';

// ============================================
// BOARDS
// ============================================

export async function createBoard(input: CreateBoardInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('boards')
        .insert({
            name: input.name,
            description: input.description || null,
            organization_id: input.organization_id,
            project_id: input.project_id || null,
            color: input.color || null,
            icon: input.icon || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating board:', error);
        throw new Error('Error al crear el tablero');
    }

    revalidatePath(PLANNER_PATH);
    return data;
}

export async function updateBoard(boardId: string, input: UpdateBoardInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('boards')
        .update(input)
        .eq('id', boardId)
        .select()
        .single();

    if (error) {
        console.error('Error updating board:', error);
        throw new Error('Error al actualizar el tablero');
    }

    revalidatePath(PLANNER_PATH);
    return data;
}

export async function deleteBoard(boardId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('boards')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', boardId);

    if (error) {
        console.error('Error deleting board:', error);
        throw new Error('Error al eliminar el tablero');
    }

    revalidatePath(PLANNER_PATH);
}

// ============================================
// LISTS
// ============================================

export async function createList(input: CreateListInput) {
    const supabase = await createClient();

    // Get organization_id from board
    const { data: boardData } = await supabase
        .schema('planner').from('boards')
        .select('organization_id')
        .eq('id', input.board_id)
        .single();

    if (!boardData) throw new Error('Tablero no encontrado');

    // Get max position
    const { data: existingLists } = await supabase
        .schema('planner').from('lists')
        .select('position')
        .eq('board_id', input.board_id)
        .order('position', { ascending: false })
        .limit(1);

    const maxPosition = existingLists?.[0]?.position ?? -1;

    const { data, error } = await supabase
        .schema('planner').from('lists')
        .insert({
            board_id: input.board_id,
            organization_id: boardData.organization_id,
            name: input.name,
            position: input.position ?? maxPosition + 1,
            color: input.color || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating list:', error);
        throw new Error(`Error al crear la columna: ${sanitizeError(error)}`);
    }

    revalidatePath(PLANNER_PATH);
    return data;
}

export async function updateList(listId: string, input: Partial<CreateListInput>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('lists')
        .update(input)
        .eq('id', listId)
        .select()
        .single();

    if (error) {
        console.error('Error updating list:', error);
        throw new Error('Error al actualizar la columna');
    }

    revalidatePath(PLANNER_PATH);
    return data;
}

export async function deleteList(listId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('lists')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', listId);

    if (error) {
        console.error('Error deleting list:', error);
        throw new Error('Error al eliminar la columna');
    }

    revalidatePath(PLANNER_PATH);
}

export async function moveList(listId: string, targetBoardId: string) {
    const supabase = await createClient();

    const { data: targetBoard } = await supabase
        .schema('planner').from('boards')
        .select('id, organization_id')
        .eq('id', targetBoardId)
        .single();

    if (!targetBoard) throw new Error('Tablero de destino no encontrado');

    const { data: existingLists } = await supabase
        .schema('planner').from('lists')
        .select('position')
        .eq('board_id', targetBoardId)
        .order('position', { ascending: false })
        .limit(1);

    const maxPosition = existingLists?.[0]?.position ?? -1;

    const { error } = await supabase
        .schema('planner').from('lists')
        .update({
            board_id: targetBoardId,
            position: maxPosition + 1,
        })
        .eq('id', listId);

    if (error) {
        console.error('Error moving list:', error);
        throw new Error('Error al mover la columna');
    }

    revalidatePath(PLANNER_PATH);
}

export async function reorderLists(boardId: string, listIds: string[]) {
    const supabase = await createClient();

    const updates = listIds.map((id, index) =>
        supabase
            .schema('planner').from('lists')
            .update({ position: index })
            .eq('id', id)
            .eq('board_id', boardId)
    );

    const results = await Promise.all(updates);
    const error = results.find(r => r.error)?.error;

    if (error) {
        console.error('Error reordering lists:', error);
        throw new Error(`Error al reordenar las columnas: ${sanitizeError(error)}`);
    }

    revalidatePath(PLANNER_PATH);
}

// ============================================
// ITEMS (unified tasks + events)
// ============================================

export async function createItem(input: CreateItemInput) {
    const supabase = await createClient();

    // If board_id provided, get max position in the list
    let position = 0;
    if (input.list_id) {
        const { data: existingItems } = await supabase
            .schema('planner').from('items')
            .select('position')
            .eq('list_id', input.list_id)
            .order('position', { ascending: false })
            .limit(1);

        position = (existingItems?.[0]?.position ?? -1) + 1;
    }

    const { data, error } = await supabase
        .schema('planner').from('items')
        .insert({
            organization_id: input.organization_id,
            item_type: input.item_type || 'task',
            title: input.title,
            description: input.description || null,
            color: input.color || null,
            // Time
            start_at: input.start_at || null,
            due_at: input.due_at || null,
            end_at: input.end_at || null,
            is_all_day: input.is_all_day ?? true,
            timezone: input.timezone || 'America/Argentina/Buenos_Aires',
            // Task
            priority: input.priority || 'none',
            estimated_hours: input.estimated_hours || null,
            assigned_to: input.assigned_to || null,
            // Event
            location: input.location || null,
            // Kanban
            board_id: input.board_id || null,
            list_id: input.list_id || null,
            position,
            // Context
            project_id: input.project_id || null,
            cover_image_url: input.cover_image_url || null,
            // Source
            source_type: input.source_type || null,
            source_id: input.source_id || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating item:', error);
        throw new Error(`Error al crear el item: ${sanitizeError(error)}`);
    }

    revalidatePath(PLANNER_PATH);
    return data;
}

export async function updateItem(itemId: string, input: UpdateItemInput) {
    const supabase = await createClient();

    // Handle completion
    const updateData: any = { ...input };
    if (input.is_completed === true && !input.status) {
        updateData.status = 'done';
        updateData.completed_at = new Date().toISOString();
    } else if (input.is_completed === false) {
        updateData.completed_at = null;
        if (!input.status) updateData.status = 'todo';
    }

    const { data, error } = await supabase
        .schema('planner').from('items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

    if (error) {
        console.error('Error updating item:', error);
        throw new Error(`Error al actualizar el item: ${sanitizeError(error)}`);
    }

    revalidatePath(PLANNER_PATH);
    return data;
}

export async function deleteItem(itemId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('items')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', itemId);

    if (error) {
        console.error('Error deleting item:', error);
        throw new Error('Error al eliminar el item');
    }

    revalidatePath(PLANNER_PATH);
}

export async function moveItem(itemId: string, targetListId: string, targetPosition: number) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('items')
        .update({
            list_id: targetListId,
            position: targetPosition,
        })
        .eq('id', itemId);

    if (error) {
        console.error('Error moving item:', error);
        throw new Error('Error al mover el item');
    }

    revalidatePath(PLANNER_PATH);
}

export async function reorderItems(listId: string, itemIds: string[]) {
    const supabase = await createClient();

    const updates = itemIds.map((id, index) =>
        supabase
            .schema('planner').from('items')
            .update({
                position: index,
                list_id: listId,
            })
            .eq('id', id)
    );

    const results = await Promise.all(updates);
    const error = results.find(r => r.error)?.error;

    if (error) {
        console.error('Error reordering items:', error);
        throw new Error(`Error al reordenar los items: ${sanitizeError(error)}`);
    }

    revalidatePath(PLANNER_PATH);
}

// ============================================
// LABELS
// ============================================

export async function createLabel(organizationId: string, name: string, color: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('labels')
        .insert({
            organization_id: organizationId,
            name,
            color,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating label:', error);
        throw new Error('Error al crear la etiqueta');
    }

    revalidatePath(PLANNER_PATH);
    return data;
}

export async function addLabelToItem(itemId: string, labelId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('item_labels')
        .insert({
            item_id: itemId,
            label_id: labelId,
        });

    if (error && error.code !== '23505') {
        console.error('Error adding label:', error);
        throw new Error('Error al agregar la etiqueta');
    }

    revalidatePath(PLANNER_PATH);
}

export async function removeLabelFromItem(itemId: string, labelId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('item_labels')
        .delete()
        .eq('item_id', itemId)
        .eq('label_id', labelId);

    if (error) {
        console.error('Error removing label:', error);
        throw new Error('Error al quitar la etiqueta');
    }

    revalidatePath(PLANNER_PATH);
}

// ============================================
// BACKWARD COMPAT ALIASES (remove after migration)
// ============================================

/** @deprecated Use createItem with item_type: 'task' */
export async function createCard(input: CreateItemInput) {
    return createItem({ ...input, item_type: 'task' });
}

/** @deprecated Use updateItem */
export const updateCard = updateItem;
/** @deprecated Use deleteItem */
export const deleteCard = deleteItem;
/** @deprecated Use moveItem */
export const moveCard = moveItem;
/** @deprecated Use reorderItems */
export const reorderCards = reorderItems;
/** @deprecated Use addLabelToItem */
export const addLabelToCard = addLabelToItem;
/** @deprecated Use removeLabelFromItem */
export const removeLabelFromCard = removeLabelFromItem;

/** @deprecated Use createItem with item_type: 'event' */
export async function createCalendarEvent(input: CreateItemInput) {
    return createItem({
        ...input,
        item_type: 'event',
        color: input.color || '#3b82f6',
        is_all_day: input.is_all_day ?? false,
    });
}

/** @deprecated Use updateItem */
export const updateCalendarEvent = updateItem;
/** @deprecated Use deleteItem */
export const deleteCalendarEvent = deleteItem;
