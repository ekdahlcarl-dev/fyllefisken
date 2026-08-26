alter table public.catches
  add constraint catches_length_cm_integer_check
  check (length_cm = trunc(length_cm));
