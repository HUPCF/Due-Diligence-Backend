-- Migration script to change file_paths from JSON to LONGTEXT
-- Run this if your database already has the file_paths column as JSON

ALTER TABLE user_responses MODIFY COLUMN file_paths LONGTEXT;

