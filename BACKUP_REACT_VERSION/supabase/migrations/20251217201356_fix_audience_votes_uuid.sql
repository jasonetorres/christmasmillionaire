/*
  # Fix audience_votes table UUID generation

  1. Changes
    - Add default UUID generation for audience_votes.id column
    - This allows votes to be inserted without explicitly providing an ID
  
  2. Notes
    - Uses gen_random_uuid() function for automatic UUID generation
    - Ensures voting functionality works properly
*/

ALTER TABLE audience_votes 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();