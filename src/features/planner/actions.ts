"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
    CreateBoardInput,
    UpdateBoardInput,
    CreateListInput,
    CreateCardInput,
    UpdateCardInput,
    CreateCalendarEventInput,
    UpdateCalendarEventInput
} from "./types";

// ============================================
// BOARDS
// ============================================

export async function createBoard(input: CreateBoardInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('kanban_boards')
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

    revalidatePath('/organization/kanban');
    return data;
}

export async function updateBoard(boardId: string, input: UpdateBoardInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('kanban_boards')
        .update({
            ...input,
            updated_at: new Date().toISOString(),
        })
        .eq('id', boardId)
        .select()
        .single();

    if (error) {
        console.error('Error updating board:', error);
        throw new Error('Error al actualizar el tablero');
    }

    revalidatePath('/organization/kanban');
    return data;
}

export async function deleteBoard(boardId: string) {
    const supabase = await createClient();

    // Soft delete
    const { error } = await supabase
        .schema('planner').from('kanban_boards')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', boardId);

    if (error) {
        console.error('Error deleting board:', error);
        throw new Error('Error al eliminar el tablero');
    }

    revalidatePath('/organization/kanban');
}

// ============================================
// LISTS
// ============================================

export async function createList(input: CreateListInput) {
    const supabase = await createClient();

    // Get organization_id from board
    const { data: boardData } = await supabase
        .schema('planner').from('kanban_boards')
        .select('organization_id')
        .eq('id', input.board_id)
        .single();

    if (!boardData) throw new Error('Tablero no encontrado');

    // Get max position
    const { data: existingLists } = await supabase
        .schema('planner').from('kanban_lists')
        .select('position')
        .eq('board_id', input.board_id)
        .order('position', { ascending: false })
        .limit(1);

    const maxPosition = existingLists?.[0]?.position ?? -1;

    const { data, error } = await supabase
        .schema('planner').from('kanban_lists')
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

    revalidatePath('/organization/kanban');
    return data;
}

export async function updateList(listId: string, input: Partial<CreateListInput>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('kanban_lists')
        .update({
            ...input,
            updated_at: new Date().toISOString(),
        })
        .eq('id', listId)
        .select()
        .single();

    if (error) {
        console.error('Error updating list:', error);
        throw new Error('Error al actualizar la columna');
    }

    revalidatePath('/organization/kanban');
    return data;
}

export async function deleteList(listId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('kanban_lists')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', listId);

    if (error) {
        console.error('Error deleting list:', error);
        throw new Error('Error al eliminar la columna');
    }

    revalidatePath('/organization/kanban');
}

export async function moveList(listId: string, targetBoardId: string) {
    const supabase = await createClient();

    // Get target board to check existence and max position
    const { data: targetBoard } = await supabase
        .schema('planner').from('kanban_boards')
        .select('id, organization_id')
        .eq('id', targetBoardId)
        .single();

    if (!targetBoard) throw new Error('Tablero de destino no encontrado');

    // Get max position in target board
    const { data: existingLists } = await supabase
        .schema('planner').from('kanban_lists')
        .select('position')
        .eq('board_id', targetBoardId)
        .order('position', { ascending: false })
        .limit(1);

    const maxPosition = existingLists?.[0]?.position ?? -1;

    // Update list
    const { error } = await supabase
        .schema('planner').from('kanban_lists')
        .update({
            board_id: targetBoardId,
            position: maxPosition + 1,
            updated_at: new Date().toISOString()
        })
        .eq('id', listId);

    if (error) {
        console.error('Error moving list:', error);
        throw new Error('Error al mover la columna');
    }

    revalidatePath('/organization/kanban');
}

export async function reorderLists(boardId: string, listIds: string[]) {
    const supabase = await createClient();

    // Update positions in batch
    // Update positions using separate update queries to avoid upsert/insert issues
    const updates = listIds.map((id, index) =>
        supabase
            .schema('planner').from('kanban_lists')
            .update({ position: index, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('board_id', boardId) // Security check
    );

    const results = await Promise.all(updates);

    // Check for any errors in the batch
    const error = results.find(r => r.error)?.error;

    if (error) {
        console.error('Error reordering lists:', error);
        throw new Error(`Error al reordenar las columnas: ${sanitizeError(error)} (Code: ${error.code})`);
    }

    revalidatePath('/organization/kanban');
}

// ============================================
// CARDS
// ============================================

export async function createCard(input: CreateCardInput) {
    const supabase = await createClient();

    // Get organization_id for the card
    const { data: boardData } = await supabase
        .schema('planner').from('kanban_boards')
        .select('organization_id')
        .eq('id', input.board_id)
        .single();

    if (!boardData) throw new Error('Tablero no encontrado para la tarjeta');

    // Get max position in the target list
    const { data: existingCards } = await supabase
        .schema('planner').from('kanban_cards')
        .select('position')
        .eq('list_id', input.list_id)
        .order('position', { ascending: false })
        .limit(1);

    const maxPosition = existingCards?.[0]?.position ?? -1;

    const { data, error } = await supabase
        .schema('planner').from('kanban_cards')
        .insert({
            list_id: input.list_id,
            board_id: input.board_id,
            organization_id: boardData.organization_id,
            title: input.title,
            description: input.description || null,
            priority: input.priority || 'none',
            due_date: input.due_date || null,
            start_date: input.start_date || null,
            estimated_hours: input.estimated_hours || null,
            assigned_to: input.assigned_to || null,
            cover_image_url: input.cover_image_url || null,
            project_id: input.project_id || null,
            position: maxPosition + 1,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating card:', error);
        throw new Error(`Error al crear la tarjeta: ${sanitizeError(error)} (Code: ${error.code})`);
    }

    revalidatePath('/organization/kanban');
    return data;
}

export async function updateCard(cardId: string, input: UpdateCardInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('kanban_cards')
        .update({
            ...input,
            updated_at: new Date().toISOString(),
        })
        .eq('id', cardId)
        .select()
        .single();

    if (error) {
        console.error('Error updating card:', error);
        throw new Error(`Error al actualizar la tarjeta: ${sanitizeError(error)} (Code: ${error.code})`);
    }

    revalidatePath('/organization/kanban');
    return data;
}

export async function deleteCard(cardId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('kanban_cards')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', cardId);

    if (error) {
        console.error('Error deleting card:', error);
        throw new Error('Error al eliminar la tarjeta');
    }

    revalidatePath('/organization/kanban');
}

export async function moveCard(cardId: string, targetListId: string, targetPosition: number) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('kanban_cards')
        .update({
            list_id: targetListId,
            position: targetPosition,
            updated_at: new Date().toISOString(),
        })
        .eq('id', cardId);

    if (error) {
        console.error('Error moving card:', error);
        throw new Error('Error al mover la tarjeta');
    }

    revalidatePath('/organization/kanban');
}

export async function reorderCards(listId: string, cardIds: string[]) {
    const supabase = await createClient();

    // Update positions in batch using individual updates
    // This is safer than upsert for partial updates due to NOT NULL constraints
    const updates = cardIds.map((id, index) =>
        supabase
            .schema('planner').from('kanban_cards')
            .update({
                position: index,
                list_id: listId, // Ensure list_id is consistent
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const error = results.find(r => r.error)?.error;

    if (error) {
        console.error('Error reordering cards:', error);
        throw new Error(`Error al reordenar las tarjetas: ${sanitizeError(error)} (Code: ${error.code})`);
    }

    revalidatePath('/organization/kanban');
}

// ============================================
// LABELS
// ============================================

export async function createLabel(organizationId: string, name: string, color: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('kanban_labels')
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

    revalidatePath('/organization/kanban');
    return data;
}

export async function addLabelToCard(cardId: string, labelId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('kanban_card_labels')
        .insert({
            card_id: cardId,
            label_id: labelId,
        });

    if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Error adding label:', error);
        throw new Error('Error al agregar la etiqueta');
    }

    revalidatePath('/organization/kanban');
}

export async function removeLabelFromCard(cardId: string, labelId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('planner').from('kanban_card_labels')
        .delete()
        .eq('card_id', cardId)
        .eq('label_id', labelId);

    if (error) {
        console.error('Error removing label:', error);
        throw new Error('Error al quitar la etiqueta');
    }

    revalidatePath('/organization/kanban');
}

// ============================================
// CALENDAR EVENTS
// ============================================

export async function createCalendarEvent(input: CreateCalendarEventInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('calendar_events')
        .insert({
            organization_id: input.organization_id,
            project_id: input.project_id || null,
            title: input.title,
            description: input.description || null,
            location: input.location || null,
            color: input.color || '#3b82f6',
            start_at: input.start_at,
            end_at: input.end_at || null,
            is_all_day: input.is_all_day || false,
            timezone: input.timezone || 'America/Argentina/Buenos_Aires',
            source_type: input.source_type || null,
            source_id: input.source_id || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating calendar event:', error);
        throw new Error(`Error al crear el evento: ${sanitizeError(error)}`);
    }

    revalidatePath('/organization/planner');
    return data;
}

export async function updateCalendarEvent(eventId: string, input: UpdateCalendarEventInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('calendar_events')
        .update({
            ...input,
            updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

    if (error) {
        console.error('Error updating calendar event:', error);
        throw new Error(`Error al actualizar el evento: ${sanitizeError(error)}`);
    }

    revalidatePath('/organization/planner');
    return data;
}

export async function deleteCalendarEvent(eventId: string) {
    const supabase = await createClient();

    // Soft delete
    const { error } = await supabase
        .schema('planner').from('calendar_events')
        .update({
            // is_deleted: true, // Removed in favor of deleted_at
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

    if (error) {
        console.error('Error deleting calendar event:', error);
        throw new Error(`Error al eliminar el evento: ${sanitizeError(error)} (${error.code})`);
    }

    revalidatePath('/organization/planner');
}


