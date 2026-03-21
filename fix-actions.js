const fs = require('fs');
const path = 'c:/Users/Usuario/Seencel/seencel-v2/src/features/tasks/actions.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace standard revalidatePath inside Recipe methods
const recipeFunctions = [
    'addRecipeMaterial',
    'updateRecipeMaterial',
    'deleteRecipeMaterial',
    'addRecipeLabor',
    'updateRecipeLabor',
    'deleteRecipeLabor',
    'addRecipeExternalService',
    'updateRecipeExternalService',
    'deleteRecipeExternalService',
    'removeAllRecipeMaterials',
    'removeAllRecipeLabor',
    'rateRecipe',
    'adoptRecipe'
];

for (const fn of recipeFunctions) {
    const fnRegex = new RegExp('export async function ' + fn + '[\\s\\S]*?return \\{');
    const match = code.match(fnRegex);
    if (match) {
        const endOfFn = match[0];
        let newBlock = endOfFn.replace(
            /revalidatePath\([^)]+\);\s*(?:revalidatePath\([^)]+\);\s*)*/g,
            'revalidatePath("/organization/catalog", "layout");\n    revalidatePath("/admin/catalog", "layout");\n    '
        );
        code = code.replace(endOfFn, newBlock);
    }
}

fs.writeFileSync(path, code);
console.log('Fixed revalidatePaths in actions.ts');
