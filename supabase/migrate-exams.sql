-- Coach Dashboard — add the exam dimension to marks.
-- Run ONCE in Supabase Dashboard → SQL Editor (after supabase/schema.sql).
-- Keeps every existing row: they become exam 'e1' (Exam 1).

alter table public.marks
  add column if not exists exam text not null default 'e1';

-- Replace the old uniqueness (class,roll,subject) with (class,roll,subject,exam)
alter table public.marks
  drop constraint if exists marks_class_roll_subject_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'marks_class_roll_subject_exam_key'
  ) then
    alter table public.marks
      add constraint marks_class_roll_subject_exam_key
      unique (class, roll, subject, exam);
  end if;
end $$;
