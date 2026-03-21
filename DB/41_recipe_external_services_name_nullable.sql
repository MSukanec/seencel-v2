-- Make external service name optional
ALTER TABLE catalog.task_recipe_external_services ALTER COLUMN name DROP NOT NULL;
