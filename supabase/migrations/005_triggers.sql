-- Auto-update updated_at columns
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger resources_updated_at before update on resources
  for each row execute function update_updated_at();
create trigger bookings_updated_at before update on bookings
  for each row execute function update_updated_at();
create trigger user_credentials_updated_at before update on user_credentials
  for each row execute function update_updated_at();
create trigger incidents_updated_at before update on incidents
  for each row execute function update_updated_at();

-- Auto-create profile after user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
