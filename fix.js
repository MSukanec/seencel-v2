const fs = require('fs');
const path = 'src/features/tasks/actions.ts';
let code = fs.readFileSync(path, 'utf8');

const regex1 = /revalidatePath\("\/admin\/catalog"\);\s*return \{ success: true, data: result \};/g;
code = code.replace(regex1, 'revalidatePath("/organization/catalog", "layout");\n    revalidatePath("/admin/catalog", "layout");\n    return { success: true, data: result };');

const regex2 = /revalidatePath\("\/admin\/catalog"\);\s*return \{ success: true \};/g;
code = code.replace(regex2, 'revalidatePath("/organization/catalog", "layout");\n    revalidatePath("/admin/catalog", "layout");\n    return { success: true };');

fs.writeFileSync(path, code);
console.log("FIXED");
