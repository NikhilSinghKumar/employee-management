drop extension if exists "pg_net";

create sequence "public"."allowed_emails_id_seq";

create sequence "public"."business_enquiry_id_seq";

create sequence "public"."employees_id_seq";

create sequence "public"."users_id_seq";


  create table "public"."accommodation_transport" (
    "id" uuid not null default gen_random_uuid(),
    "checkin_id" text,
    "checkin_name" text,
    "nationality" text,
    "passport_number" text,
    "iqama_number" text,
    "client_name" text,
    "client_number" text,
    "location" text,
    "contract_type" text,
    "checkin_date" date,
    "checkout_date" date,
    "status" text,
    "created_by" integer,
    "edited_by" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_deleted" boolean not null default false
      );



  create table "public"."allowed_emails" (
    "id" integer not null default nextval('public.allowed_emails_id_seq'::regclass),
    "email" text not null,
    "allowed_sections" text[] default '{}'::text[],
    "is_active" boolean not null default true,
    "created_at" timestamp without time zone default now(),
    "is_deleted" boolean not null default false,
    "role" text not null default 'user'::text
      );



  create table "public"."at_generated_timesheet" (
    "at_timesheet_month" date not null,
    "iqama_number" text not null,
    "checkin_name" text,
    "location" text,
    "client_number" text not null,
    "client_name" text,
    "contract_type" text,
    "checkin_date" date,
    "checkout_date" date,
    "at_days_count" integer generated always as (GREATEST(0, (checkout_date - checkin_date))) stored,
    "at_monthly_cost" numeric default 0,
    "at_worker_cost" numeric generated always as (((at_monthly_cost * ((checkout_date - checkin_date))::numeric) / 30.0)) stored,
    "at_vat" numeric generated always as ((((at_monthly_cost * ((checkout_date - checkin_date))::numeric) / 30.0) * 0.15)) stored,
    "at_sum" numeric generated always as ((((at_monthly_cost * ((checkout_date - checkin_date))::numeric) / 30.0) + (((at_monthly_cost * ((checkout_date - checkin_date))::numeric) / 30.0) * 0.15))) stored,
    "generated_by" integer,
    "edited_by" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "month" integer generated always as (EXTRACT(month FROM checkin_date)) stored,
    "year" integer generated always as (EXTRACT(year FROM checkin_date)) stored
      );



  create table "public"."business_enquiry" (
    "id" integer not null default nextval('public.business_enquiry_id_seq'::regclass),
    "company_name" character varying(255) not null,
    "contact_person_name" character varying(255),
    "company_cr_number" character varying(100),
    "mobile_no" character varying(20),
    "email_id" character varying(255),
    "request_type" character varying(100),
    "description" text,
    "is_deleted" boolean default false,
    "created_at" timestamp without time zone default now(),
    "status" text default 'new'::text,
    "assigned_to" text,
    "follow_up_date" date,
    "remarks" text,
    "source" text,
    "updated_at" timestamp without time zone default now()
      );



  create table "public"."employee_request" (
    "id" uuid not null default gen_random_uuid(),
    "cm_name" text not null,
    "cm_mobile_no" text not null,
    "cm_email" text,
    "cm_nationality" text not null,
    "cm_passport_iqama" text not null,
    "cm_city" text,
    "cm_client_name" text not null,
    "cm_complaint_description" text,
    "cm_status" text not null default 'open'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone,
    "cm_resolved_by" text,
    "is_deleted" boolean not null default false,
    "remarks" text,
    "assigned_to" text
      );



  create table "public"."employees" (
    "id" integer not null default nextval('public.employees_id_seq'::regclass),
    "name" text not null,
    "mobile" text,
    "email" text,
    "dob" date,
    "et_number" text,
    "iqama_number" text,
    "iqama_expiry_date" date,
    "bank_account" text,
    "nationality" text,
    "passport_number" text,
    "passport_expiry_date" date,
    "profession" text,
    "client_number" text,
    "client_name" text,
    "contract_start_date" date,
    "contract_end_date" date,
    "basic_salary" numeric,
    "hra_type" text,
    "hra" numeric,
    "tra_type" text,
    "tra" numeric,
    "food_allowance_type" text,
    "food_allowance" numeric,
    "other_allowance" numeric,
    "total_salary" numeric,
    "medical" text,
    "employee_status" text,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "employee_source" text,
    "is_deleted" boolean not null default false
      );



  create table "public"."etmam_staff" (
    "etmam_staff_id" uuid not null default gen_random_uuid(),
    "name" character varying(255) not null,
    "mobile" character varying(20),
    "email" character varying(255),
    "dob" date,
    "et_no" character varying(50),
    "iqama_no" character varying(50),
    "iqama_exp_date" date,
    "bank_account" character varying(50),
    "nationality" character varying(100),
    "passport_no" character varying(50),
    "passport_exp_date" date,
    "profession" character varying(100),
    "company_staff" character varying(50),
    "department" character varying(100),
    "contract_start_date" date,
    "contract_end_date" date,
    "staff_source" character varying(100),
    "basic_salary" numeric(10,2),
    "hra_type" character varying(50),
    "hra" numeric(10,2),
    "tra_type" character varying(50),
    "tra" numeric(10,2),
    "food_allowance" numeric(10,2),
    "other_allowance" numeric(10,2),
    "total_salary" numeric(10,2),
    "medical" character varying(100),
    "staff_status" character varying(50),
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "food_allowance_type" character varying(50)
      );



  create table "public"."generated_timesheet" (
    "uid" uuid not null default gen_random_uuid(),
    "employee_id" integer,
    "timesheet_month" date not null,
    "working_days" numeric(5,2) not null default 30,
    "overtime_hrs" numeric(5,2) not null default 0,
    "absent_hrs" numeric(5,2) not null default 0,
    "basic_salary" numeric(10,2) not null,
    "total_salary" numeric(10,2) not null,
    "overtime" numeric(10,2) generated always as ((((basic_salary * 1.5) / (240)::numeric) * overtime_hrs)) stored,
    "incentive" numeric(10,2) default 0,
    "deductions" numeric(10,2) generated always as (((total_salary * absent_hrs) / ((30 * 8))::numeric)) stored,
    "etmam_cost" numeric(10,2) default 1000,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "generated_by" integer,
    "edited_by" integer,
    "client_number" text,
    "client_name" text,
    "penalty" numeric(10,2) default 0,
    "adjusted_salary" numeric(10,2) generated always as (((((((total_salary * working_days) / (30)::numeric) - ((total_salary * absent_hrs) / ((30 * 8))::numeric)) + incentive) - penalty) + (((basic_salary * 1.5) / (240)::numeric) * overtime_hrs))) stored,
    "total_cost" numeric(10,2) generated always as ((etmam_cost + ((((((total_salary * working_days) / (30)::numeric) - ((total_salary * absent_hrs) / ((30 * 8))::numeric)) + incentive) - penalty) + (((basic_salary * 1.5) / (240)::numeric) * overtime_hrs)))) stored,
    "vat" numeric(10,2) generated always as (((etmam_cost + ((((((total_salary * working_days) / (30)::numeric) - ((total_salary * absent_hrs) / ((30 * 8))::numeric)) + incentive) - penalty) + (((basic_salary * 1.5) / (240)::numeric) * overtime_hrs))) * 0.15)) stored,
    "net_cost" numeric(10,2) generated always as (((etmam_cost + ((((((total_salary * working_days) / (30)::numeric) - ((total_salary * absent_hrs) / ((30 * 8))::numeric)) + incentive) - penalty) + (((basic_salary * 1.5) / (240)::numeric) * overtime_hrs))) * 1.15)) stored,
    "iqama_number" text,
    "employee_name" text,
    "is_deleted" boolean default false
      );



  create table "public"."generated_timesheet_summary" (
    "uid" uuid not null default gen_random_uuid(),
    "timesheet_month" date not null,
    "client_number" character varying(50) not null,
    "client_name" character varying(100) not null,
    "employee_count" integer not null,
    "total_salary_sum" numeric(12,2) not null,
    "adjusted_salary_sum" numeric(12,2) not null,
    "etmam_cost_sum" numeric(12,2) not null,
    "vat_sum" numeric(12,2) not null,
    "grand_total" numeric(12,2) not null,
    "status" character varying(20) not null default 'draft'::character varying,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "generated_by" integer,
    "edited_by" integer,
    "working_days_count" numeric(12,2) not null,
    "total_cost_sum" numeric(12,2) not null,
    "is_deleted" boolean default false
      );



  create table "public"."job_applicant" (
    "id" uuid not null default gen_random_uuid(),
    "applicant_name" text not null,
    "applicant_mobile_no" text not null,
    "applicant_nationality" text not null,
    "applicant_passport_iqama" text not null,
    "applicant_city" text not null,
    "applicant_experience_years" numeric not null,
    "applicant_is_notice_period" boolean not null default false,
    "applicant_notice_period_days" integer not null default 0,
    "applicant_current_salary" numeric,
    "applicant_expected_salary" numeric,
    "applicant_cv_url" text,
    "applicant_description" text,
    "applicant_status" text not null default 'pending'::text,
    "is_deleted" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "job_id" text
      );



  create table "public"."job_list" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" text not null,
    "job_title" text not null,
    "job_location" text,
    "job_opening_date" date not null,
    "job_closing_date" date,
    "job_description" text,
    "job_key_skills" text,
    "job_salary" text,
    "job_benefits" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_deleted" boolean not null default false,
    "job_status" text default 'open'::text,
    "created_by" text,
    "edited_by" text
      );



  create table "public"."logs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "event" text not null,
    "user_email" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP
      );



  create table "public"."quotations" (
    "id" uuid not null default gen_random_uuid(),
    "date" date,
    "quotation_no" text,
    "company_name" text,
    "company_cr_number" text,
    "company_activity" text,
    "signatory" text,
    "designation" text,
    "mobile_no" text,
    "email" text,
    "remarks" text,
    "person_name" text,
    "etmam_commitments" text,
    "client_commitments" text,
    "general_terms" text,
    "quotation_type" text,
    "contract_duration" text,
    "workers_mode" text,
    "no_of_workers" integer,
    "nationality_mode" text,
    "nationality" text,
    "professions" text,
    "basic_salary" numeric,
    "food_allowance" numeric,
    "accommodation_cost" numeric,
    "transportation_cost" numeric,
    "other_costs" numeric,
    "monthly_cost_per_worker" numeric,
    "created_by" text,
    "edited_by" text,
    "is_deleted" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."users" (
    "id" integer not null default nextval('public.users_id_seq'::regclass),
    "first_name" character varying(50) not null,
    "last_name" character varying(50) not null,
    "email" character varying(100) not null,
    "password" text not null,
    "created_at" timestamp without time zone default now(),
    "reset_token" text,
    "allowed_sections" text[] default '{}'::text[],
    "role" text not null default 'user'::text,
    "is_active" boolean not null default true,
    "is_deleted" boolean not null default false
      );


alter sequence "public"."allowed_emails_id_seq" owned by "public"."allowed_emails"."id";

alter sequence "public"."business_enquiry_id_seq" owned by "public"."business_enquiry"."id";

alter sequence "public"."employees_id_seq" owned by "public"."employees"."id";

alter sequence "public"."users_id_seq" owned by "public"."users"."id";

CREATE UNIQUE INDEX accommodation_transport_iqama_number_key ON public.accommodation_transport USING btree (iqama_number);

CREATE UNIQUE INDEX accommodation_transport_pkey ON public.accommodation_transport USING btree (id);

CREATE UNIQUE INDEX allowed_emails_email_key ON public.allowed_emails USING btree (email);

CREATE UNIQUE INDEX allowed_emails_pkey ON public.allowed_emails USING btree (id);

CREATE UNIQUE INDEX at_generated_timesheet_iqama_number_client_number_month_yea_key ON public.at_generated_timesheet USING btree (iqama_number, client_number, month, year);

CREATE UNIQUE INDEX at_generated_timesheet_pkey ON public.at_generated_timesheet USING btree (iqama_number);

CREATE UNIQUE INDEX business_enquiry_pkey ON public.business_enquiry USING btree (id);

CREATE UNIQUE INDEX employee_request_pkey ON public.employee_request USING btree (id);

CREATE UNIQUE INDEX employees_pkey ON public.employees USING btree (id);

CREATE UNIQUE INDEX etmam_staff_pkey ON public.etmam_staff USING btree (etmam_staff_id);

CREATE UNIQUE INDEX etmam_staff_staff_id_key ON public.etmam_staff USING btree (company_staff);

CREATE UNIQUE INDEX generated_timesheet_pkey ON public.generated_timesheet USING btree (uid);

CREATE UNIQUE INDEX generated_timesheet_summary_pkey ON public.generated_timesheet_summary USING btree (uid);

CREATE UNIQUE INDEX generated_timesheet_summary_timesheet_month_client_number_key ON public.generated_timesheet_summary USING btree (timesheet_month, client_number);

CREATE INDEX idx_employees_client_number ON public.employees USING btree (client_number);

CREATE UNIQUE INDEX job_applicant_pkey ON public.job_applicant USING btree (id);

CREATE UNIQUE INDEX job_list_job_id_key ON public.job_list USING btree (job_id);

CREATE UNIQUE INDEX jobs_job_id_key ON public.job_list USING btree (job_id);

CREATE UNIQUE INDEX jobs_pkey ON public.job_list USING btree (id);

CREATE UNIQUE INDEX logs_pkey ON public.logs USING btree (id);

CREATE UNIQUE INDEX quotations_pkey ON public.quotations USING btree (id);

CREATE UNIQUE INDEX unique_iqama_client_month ON public.generated_timesheet USING btree (iqama_number, client_number, timesheet_month);

CREATE UNIQUE INDEX unique_iqama_number ON public.employees USING btree (iqama_number);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."accommodation_transport" add constraint "accommodation_transport_pkey" PRIMARY KEY using index "accommodation_transport_pkey";

alter table "public"."allowed_emails" add constraint "allowed_emails_pkey" PRIMARY KEY using index "allowed_emails_pkey";

alter table "public"."at_generated_timesheet" add constraint "at_generated_timesheet_pkey" PRIMARY KEY using index "at_generated_timesheet_pkey";

alter table "public"."business_enquiry" add constraint "business_enquiry_pkey" PRIMARY KEY using index "business_enquiry_pkey";

alter table "public"."employee_request" add constraint "employee_request_pkey" PRIMARY KEY using index "employee_request_pkey";

alter table "public"."employees" add constraint "employees_pkey" PRIMARY KEY using index "employees_pkey";

alter table "public"."etmam_staff" add constraint "etmam_staff_pkey" PRIMARY KEY using index "etmam_staff_pkey";

alter table "public"."generated_timesheet" add constraint "generated_timesheet_pkey" PRIMARY KEY using index "generated_timesheet_pkey";

alter table "public"."generated_timesheet_summary" add constraint "generated_timesheet_summary_pkey" PRIMARY KEY using index "generated_timesheet_summary_pkey";

alter table "public"."job_applicant" add constraint "job_applicant_pkey" PRIMARY KEY using index "job_applicant_pkey";

alter table "public"."job_list" add constraint "jobs_pkey" PRIMARY KEY using index "jobs_pkey";

alter table "public"."logs" add constraint "logs_pkey" PRIMARY KEY using index "logs_pkey";

alter table "public"."quotations" add constraint "quotations_pkey" PRIMARY KEY using index "quotations_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."accommodation_transport" add constraint "accommodation_transport_iqama_number_check" CHECK ((iqama_number ~ '^\d{10}$'::text)) not valid;

alter table "public"."accommodation_transport" validate constraint "accommodation_transport_iqama_number_check";

alter table "public"."accommodation_transport" add constraint "accommodation_transport_iqama_number_key" UNIQUE using index "accommodation_transport_iqama_number_key";

alter table "public"."allowed_emails" add constraint "allowed_emails_email_key" UNIQUE using index "allowed_emails_email_key";

alter table "public"."at_generated_timesheet" add constraint "at_generated_timesheet_check" CHECK ((checkout_date >= checkin_date)) not valid;

alter table "public"."at_generated_timesheet" validate constraint "at_generated_timesheet_check";

alter table "public"."at_generated_timesheet" add constraint "at_generated_timesheet_iqama_number_client_number_month_yea_key" UNIQUE using index "at_generated_timesheet_iqama_number_client_number_month_yea_key";

alter table "public"."business_enquiry" add constraint "business_enquiry_request_type_check" CHECK (((request_type)::text = ANY ((ARRAY['Manpower Request (Business Solution)'::character varying, 'Accommodation Service Request'::character varying, 'Talent Acquisition Request'::character varying, 'IT Services Request'::character varying])::text[]))) not valid;

alter table "public"."business_enquiry" validate constraint "business_enquiry_request_type_check";

alter table "public"."employees" add constraint "unique_iqama_number" UNIQUE using index "unique_iqama_number";

alter table "public"."etmam_staff" add constraint "etmam_staff_staff_id_key" UNIQUE using index "etmam_staff_staff_id_key";

alter table "public"."generated_timesheet" add constraint "generated_timesheet_absent_hrs_check" CHECK ((absent_hrs >= (0)::numeric)) not valid;

alter table "public"."generated_timesheet" validate constraint "generated_timesheet_absent_hrs_check";

alter table "public"."generated_timesheet" add constraint "generated_timesheet_edited_by_fkey" FOREIGN KEY (edited_by) REFERENCES public.users(id) not valid;

alter table "public"."generated_timesheet" validate constraint "generated_timesheet_edited_by_fkey";

alter table "public"."generated_timesheet" add constraint "generated_timesheet_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT not valid;

alter table "public"."generated_timesheet" validate constraint "generated_timesheet_employee_id_fkey";

alter table "public"."generated_timesheet" add constraint "generated_timesheet_generated_by_fkey" FOREIGN KEY (generated_by) REFERENCES public.users(id) not valid;

alter table "public"."generated_timesheet" validate constraint "generated_timesheet_generated_by_fkey";

alter table "public"."generated_timesheet" add constraint "generated_timesheet_overtime_hrs_check" CHECK ((overtime_hrs >= (0)::numeric)) not valid;

alter table "public"."generated_timesheet" validate constraint "generated_timesheet_overtime_hrs_check";

alter table "public"."generated_timesheet" add constraint "generated_timesheet_working_days_check" CHECK (((working_days >= (0)::numeric) AND (working_days < (31)::numeric))) not valid;

alter table "public"."generated_timesheet" validate constraint "generated_timesheet_working_days_check";

alter table "public"."generated_timesheet" add constraint "unique_iqama_client_month" UNIQUE using index "unique_iqama_client_month";

alter table "public"."generated_timesheet_summary" add constraint "generated_timesheet_summary_edited_by_fkey" FOREIGN KEY (edited_by) REFERENCES public.users(id) not valid;

alter table "public"."generated_timesheet_summary" validate constraint "generated_timesheet_summary_edited_by_fkey";

alter table "public"."generated_timesheet_summary" add constraint "generated_timesheet_summary_employee_count_check" CHECK ((employee_count >= 0)) not valid;

alter table "public"."generated_timesheet_summary" validate constraint "generated_timesheet_summary_employee_count_check";

alter table "public"."generated_timesheet_summary" add constraint "generated_timesheet_summary_generated_by_fkey" FOREIGN KEY (generated_by) REFERENCES public.users(id) not valid;

alter table "public"."generated_timesheet_summary" validate constraint "generated_timesheet_summary_generated_by_fkey";

alter table "public"."generated_timesheet_summary" add constraint "generated_timesheet_summary_status_check" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'approved'::character varying, 'pending'::character varying])::text[]))) not valid;

alter table "public"."generated_timesheet_summary" validate constraint "generated_timesheet_summary_status_check";

alter table "public"."generated_timesheet_summary" add constraint "generated_timesheet_summary_timesheet_month_client_number_key" UNIQUE using index "generated_timesheet_summary_timesheet_month_client_number_key";

alter table "public"."job_applicant" add constraint "fk_job_applicant_job" FOREIGN KEY (job_id) REFERENCES public.job_list(job_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."job_applicant" validate constraint "fk_job_applicant_job";

alter table "public"."job_applicant" add constraint "job_applicant_applicant_experience_years_check" CHECK ((applicant_experience_years >= (0)::numeric)) not valid;

alter table "public"."job_applicant" validate constraint "job_applicant_applicant_experience_years_check";

alter table "public"."job_list" add constraint "job_list_job_id_key" UNIQUE using index "job_list_job_id_key";

alter table "public"."job_list" add constraint "jobs_job_id_key" UNIQUE using index "jobs_job_id_key";

alter table "public"."quotations" add constraint "quotations_nationality_mode_check" CHECK ((nationality_mode = ANY (ARRAY['any'::text, 'specific'::text]))) not valid;

alter table "public"."quotations" validate constraint "quotations_nationality_mode_check";

alter table "public"."quotations" add constraint "quotations_workers_mode_check" CHECK ((workers_mode = ANY (ARRAY['number'::text, 'open'::text]))) not valid;

alter table "public"."quotations" validate constraint "quotations_workers_mode_check";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

set check_function_bodies = off;

create materialized view "public"."at_timesheet_summary" as  SELECT concat(g.year, '-', lpad((g.month)::text, 2, '0'::text)) AS at_timesheet_month,
    g.client_number,
    g.client_name,
    count(DISTINCT g.iqama_number) AS at_workers_count,
    sum(g.at_worker_cost) AS sum_at_worker_cost,
    sum(g.at_vat) AS sum_at_vat,
    sum(g.at_sum) AS total_at_sum,
    ((sum(g.at_worker_cost) + sum(g.at_vat)) + sum(g.at_sum)) AS at_grand_total,
    max(g.generated_by) AS generated_by,
    max(g.edited_by) AS edited_by,
    now() AS created_at,
    now() AS updated_at
   FROM public.at_generated_timesheet g
  GROUP BY g.client_number, g.client_name, g.year, g.month;


CREATE OR REPLACE FUNCTION public.calculate_client_month_timesheet_values()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  emp_total_salary float := 0;
  emp_basic_salary float := 0;
  active_days float;
  month_start date;
  month_end date;
  proration_factor float;
  active_employee_count integer := 0;
  rec record;
  emp record; -- Added for employee loop
BEGIN
  -- Determine the start and end of the timesheet month
  month_start := NEW.timesheet_month;
  month_end := (month_start + interval '1 month' - interval '1 day')::date;

  IF NEW.employee_id IS NOT NULL THEN
    -- Employee-level timesheet: Calculate active days from status history
    active_days := 0;
    FOR rec IN
      SELECT change_date, status
      FROM employee_status_history
      WHERE employee_id = NEW.employee_id
        AND change_date <= month_end
      ORDER BY change_date
    LOOP
      IF rec.status = 'active' THEN
        active_days := active_days + 
          GREATEST(0, LEAST(month_end, (SELECT COALESCE(MIN(change_date), month_end + 1)
                                        FROM employee_status_history
                                        WHERE employee_id = NEW.employee_id
                                          AND change_date > rec.change_date)) -
                      GREATEST(month_start, rec.change_date));
      END IF;
    END LOOP;

    -- Fetch salaries for active employee
    SELECT total_salary, basic_salary
    INTO emp_total_salary, emp_basic_salary
    FROM employees
    WHERE id = NEW.employee_id AND employee_status = 'active';

    -- Calculate proration factor
    proration_factor := COALESCE(active_days, 0) / 
                       EXTRACT(DAY FROM (month_end - month_start + interval '1 day'));

    -- Prorate salaries
    emp_total_salary := COALESCE(emp_total_salary, 0) * COALESCE(proration_factor, 1);
    emp_basic_salary := COALESCE(emp_basic_salary, 0) * COALESCE(proration_factor, 1);

    -- Adjust working_days
    NEW.working_days := LEAST(COALESCE(NEW.working_days, 30), COALESCE(active_days, 30));

    -- Set active_employee_count
    active_employee_count := CASE WHEN active_days > 0 THEN 1 ELSE 0 END;
  ELSE
    -- Client-level timesheet
    FOR emp IN
      SELECT e.id, e.total_salary, e.basic_salary
      FROM employees e
      WHERE e.client_number = NEW.client_number AND e.employee_status = 'active'
    LOOP
      -- Calculate active days for each employee
      active_days := 0;
      FOR rec IN
        SELECT change_date, status
        FROM employee_status_history
        WHERE employee_id = emp.id
          AND change_date <= month_end
        ORDER BY change_date
      LOOP
        IF rec.status = 'active' THEN
          active_days := active_days + 
            GREATEST(0, LEAST(month_end, (SELECT COALESCE(MIN(change_date), month_end + 1)
                                          FROM employee_status_history
                                          WHERE employee_id = emp.id
                                            AND change_date > rec.change_date)) -
                        GREATEST(month_start, rec.change_date));
        END IF;
      END LOOP;

      -- Calculate proration factor
      proration_factor := active_days / 
                         EXTRACT(DAY FROM (month_end - month_start + interval '1 day'));

      -- Accumulate prorated salaries
      emp_total_salary := emp_total_salary + COALESCE(emp.total_salary, 0) * proration_factor;
      emp_basic_salary := emp_basic_salary + COALESCE(emp.basic_salary, 0) * proration_factor;

      -- Increment active employee count
      IF active_days > 0 THEN
        active_employee_count := active_employee_count + 1;
      END IF;
    END LOOP;

    -- Use user-provided or default working_days
    NEW.working_days := COALESCE(NEW.working_days, 30);
  END IF;

  -- Store active employee count
  NEW.active_employee_count := active_employee_count;

  -- Calculate deductions: (total_salary / (30 * 8)) * absent_hrs
  NEW.deductions := (emp_total_salary / (30.0 * 8)) * COALESCE(NEW.absent_hrs, 0);

  -- Calculate overtime: ((basic_salary / 240) * 1.5) * overtime_hrs
  NEW.overtime := ((emp_basic_salary / 240.0) * 1.5) * COALESCE(NEW.overtime_hrs, 0);

  -- Calculate adjusted_salary: (total_salary / 30) * working_days + overtime + incentive - deductions
  NEW.adjusted_salary := (emp_total_salary / 30.0) * COALESCE(NEW.working_days, 0) +
                         COALESCE(NEW.overtime, 0) + COALESCE(NEW.incentive, 0) -
                         COALESCE(NEW.deductions, 0);

  -- Calculate total_cost: adjusted_salary + etmam_cost
  NEW.total_cost := COALESCE(NEW.adjusted_salary, 0) + COALESCE(NEW.etmam_cost, 0);

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.id_as_text(r public.employee_request)
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
SELECT r.id::text;
$function$
;

CREATE OR REPLACE FUNCTION public.log_employee_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.employee_status IS DISTINCT FROM NEW.employee_status AND NEW.employee_status IS NOT NULL THEN
    -- Insert or update status history
    INSERT INTO employee_status_history (employee_id, status, change_date)
    VALUES (NEW.id, NEW.employee_status, CURRENT_DATE)
    ON CONFLICT ON CONSTRAINT employee_status_history_employee_id_change_date_key
    DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = timezone('utc', now());
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.normalize_employee_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Normalize status to lowercase and standardize variations
  NEW.status := LOWER(NEW.status);
  IF NEW.status IN ('active', 'active ', 'activ') THEN
    NEW.status := 'active';
  ELSIF NEW.status IN ('inactive', 'in active', 'in-active', 'inactiv', 'on hold', 'onhold', 'on vacation') THEN
    NEW.status := 'inactive';
  ELSE
    -- Raise error for invalid status
    RAISE EXCEPTION 'Invalid status value: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.normalize_employees_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Normalize employee_status to lowercase and standardize variations
  IF NEW.employee_status IS NOT NULL THEN
    NEW.employee_status := LOWER(NEW.employee_status);
    IF NEW.employee_status IN ('active', 'active ', 'activ') THEN
      NEW.employee_status := 'active';
    ELSIF NEW.employee_status IN ('inactive', 'in active', 'in-active', 'inactiv', 'on hold', 'onhold', 'on vacation') THEN
      NEW.employee_status := 'inactive';
    ELSE
      RAISE EXCEPTION 'Invalid employee_status value: %', NEW.employee_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.populate_client_summary_table(p_client_number text, p_timesheet_month date)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_client_name text;
  v_sum_total_employee integer := 0;
  v_sum_total_salary float := 0;
  v_sum_total_adjusted_salary float := 0;
  v_sum_total_cost float := 0;
  v_vat float := 0;
  v_grand_total float := 0;
  v_month_start date;
  v_month_end date;
  v_active_days float;
  v_proration_factor float;
  v_employee_rec record;
  v_status_rec record;
  v_working_days integer;
  v_overtime_hrs float;
  v_absent_hrs float;
  v_incentive float;
  v_etmam_cost float;
  v_deductions float;
  v_overtime float;
BEGIN
  -- Set month boundaries
  v_month_start := p_timesheet_month;
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::date;

  -- Get client_name and timesheet inputs
  SELECT
    COALESCE(client_name, 'Unknown Client'),
    COALESCE(working_days, 30),
    COALESCE(overtime_hrs, 0),
    COALESCE(absent_hrs, 0),
    COALESCE(incentive, 0),
    COALESCE(etmam_cost, 0)
  INTO
    v_client_name,
    v_working_days,
    v_overtime_hrs,
    v_absent_hrs,
    v_incentive,
    v_etmam_cost
  FROM client_month_timesheet
  WHERE client_number = p_client_number
    AND timesheet_month = p_timesheet_month
    AND employee_id IS NULL
  LIMIT 1;

  -- Calculate employee count and salaries
  FOR v_employee_rec IN
    SELECT e.id, e.total_salary, e.basic_salary
    FROM employees e
    WHERE e.client_number = p_client_number
      AND e.employee_status = 'active'
  LOOP
    v_active_days := 0;
    FOR v_status_rec IN
      SELECT change_date, status
      FROM employee_status_history
      WHERE employee_id = v_employee_rec.id
        AND change_date <= v_month_end
      ORDER BY change_date
    LOOP
      IF v_status_rec.status = 'active' THEN
        v_active_days := v_active_days + 
          GREATEST(0, LEAST(v_month_end, (SELECT COALESCE(MIN(change_date), v_month_end + 1)
                                          FROM employee_status_history
                                          WHERE employee_id = v_employee_rec.id
                                            AND change_date > v_status_rec.change_date)) -
                      GREATEST(v_month_start, v_status_rec.change_date));
      END IF;
    END LOOP;

    IF v_active_days > 0 THEN
      v_sum_total_employee := v_sum_total_employee + 1;
      v_proration_factor := v_active_days / EXTRACT(DAY FROM (v_month_end - v_month_start + interval '1 day'));
      
      -- Prorate salaries
      v_sum_total_salary := v_sum_total_salary + COALESCE(v_employee_rec.total_salary, 0) * v_proration_factor;
      
      -- Calculate deductions
      v_deductions := (v_sum_total_salary / (30.0 * 8)) * v_absent_hrs;
      
      -- Calculate overtime
      v_overtime := ((COALESCE(v_employee_rec.basic_salary, 0) * v_proration_factor / 240.0) * 1.5) * v_overtime_hrs;
      
      -- Calculate adjusted_salary
      v_sum_total_adjusted_salary := v_sum_total_adjusted_salary + 
        (v_sum_total_salary / 30.0) * v_working_days + v_overtime + v_incentive - v_deductions;
      
      -- Calculate total_cost
      v_sum_total_cost := v_sum_total_cost + v_sum_total_adjusted_salary + v_etmam_cost;
    END IF;
  END LOOP;

  -- Calculate VAT and grand total
  v_vat := 0.15 * v_sum_total_cost;
  v_grand_total := v_sum_total_cost + v_vat;

  -- Insert or update client_summary_table
  INSERT INTO client_summary_table (
    client_number,
    client_name,
    timesheet_month,
    sum_total_employee,
    sum_total_salary,
    sum_total_adjusted_salary,
    sum_total_cost,
    vat,
    grand_total
  )
  VALUES (
    p_client_number,
    v_client_name,
    p_timesheet_month,
    v_sum_total_employee,
    v_sum_total_salary,
    v_sum_total_adjusted_salary,
    v_sum_total_cost,
    v_vat,
    v_grand_total
  )
  ON CONFLICT ON CONSTRAINT client_summary_table_client_number_timesheet_month_key
  DO UPDATE SET
    client_name = EXCLUDED.client_name,
    sum_total_employee = EXCLUDED.sum_total_employee,
    sum_total_salary = EXCLUDED.sum_total_salary,
    sum_total_adjusted_salary = EXCLUDED.sum_total_adjusted_salary,
    sum_total_cost = EXCLUDED.sum_total_cost,
    vat = EXCLUDED.vat,
    grand_total = EXCLUDED.grand_total,
    updated_at = timezone('utc', now());
END;
$function$
;

CREATE OR REPLACE FUNCTION public.preserve_generated_by()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.generated_by := OLD.generated_by;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_employee_hard_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    timesheet_count int;
BEGIN
    SELECT COUNT(*) INTO timesheet_count
    FROM generated_timesheet
    WHERE employee_id = OLD.id;

    IF timesheet_count > 0 THEN
        RAISE EXCEPTION 'Hard delete not allowed: Employee has timesheet history. Use soft delete.';
    END IF;

    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_at_timesheet_summary()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  refresh materialized view at_timesheet_summary;
  return null; -- no need to return a row since it's an AFTER trigger
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_salary_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.employee_id IS NULL THEN
    RAISE EXCEPTION 'employee_id cannot be NULL';
  END IF;

  SELECT basic_salary, total_salary
  INTO NEW.basic_salary, NEW.total_salary
  FROM employees
  WHERE id = NEW.employee_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee with id % not found', NEW.employee_id;
  END IF;

  -- Optionally compute total_salary dynamically
  -- NEW.total_salary := NEW.basic_salary + COALESCE(NEW.overtime, 0) + COALESCE(NEW.incentive, 0) - COALESCE(NEW.deductions, 0);
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_client_month_timesheet_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_client_summary_table()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Call populate_client_summary_table for the affected client and month
  PERFORM populate_client_summary_table(NEW.client_number, NEW.timesheet_month);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_timesheet_summary()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_client_number VARCHAR(50);
  v_timesheet_month DATE;
BEGIN
  -- Determine timesheet_month and client_number
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.employee_id IS NULL THEN
      RAISE EXCEPTION 'employee_id cannot be NULL';
    END IF;
    v_timesheet_month := NEW.timesheet_month;

    SELECT client_number INTO v_client_number
    FROM employees
    WHERE id = NEW.employee_id;

    IF NOT FOUND THEN
      RAISE NOTICE 'Skipping summary update: employee with id % not found', NEW.employee_id;
      RETURN NULL;
    END IF;

  ELSE -- DELETE
    IF OLD.employee_id IS NULL THEN
      RAISE EXCEPTION 'employee_id cannot be NULL';
    END IF;
    v_timesheet_month := OLD.timesheet_month;

    SELECT client_number INTO v_client_number
    FROM employees
    WHERE id = OLD.employee_id;

    IF NOT FOUND THEN
      RAISE NOTICE 'Skipping summary update: employee with id % not found', OLD.employee_id;
      RETURN NULL;
    END IF;
  END IF;

  -- Insert or update summary
  INSERT INTO generated_timesheet_summary (
    timesheet_month, client_number, client_name, employee_count, 
    total_salary_sum, adjusted_salary_sum, etmam_cost_sum, vat_sum, 
    grand_total, status, generated_by, edited_by, created_at, updated_at, 
    working_days_count, total_cost_sum
  )
  SELECT
    t.timesheet_month,
    e.client_number,
    e.client_name,
    COUNT(DISTINCT t.employee_id) AS employee_count,
    COALESCE(SUM(t.total_salary), 0) AS total_salary_sum,
    COALESCE(SUM(COALESCE(t.adjusted_salary, 0)), 0) AS adjusted_salary_sum,
    COALESCE(SUM(COALESCE(t.etmam_cost, 0)), 0) AS etmam_cost_sum,
    COALESCE(SUM(COALESCE(t.vat, 0)), 0) AS vat_sum,
    COALESCE(SUM(COALESCE(t.net_cost, 0)), 0) AS grand_total,
    COALESCE(
      (SELECT status FROM generated_timesheet_summary 
       WHERE timesheet_month = t.timesheet_month AND client_number = e.client_number),
      'draft'
    ) AS status,
    NEW.generated_by AS generated_by,
    NEW.edited_by AS edited_by,
    timezone('utc', now()),
    timezone('utc', now()),
    COALESCE(SUM(t.working_days), 0) AS working_days_count,
    COALESCE(SUM(t.total_cost), 0) AS total_cost_sum
  FROM generated_timesheet t
  JOIN employees e ON t.employee_id = e.id
  WHERE t.timesheet_month = v_timesheet_month
    AND e.client_number = v_client_number
  GROUP BY t.timesheet_month, e.client_number, e.client_name
  ON CONFLICT (timesheet_month, client_number)
  DO UPDATE SET
    client_name = EXCLUDED.client_name,
    employee_count = EXCLUDED.employee_count,
    total_salary_sum = EXCLUDED.total_salary_sum,
    adjusted_salary_sum = EXCLUDED.adjusted_salary_sum,
    etmam_cost_sum = EXCLUDED.etmam_cost_sum,
    vat_sum = EXCLUDED.vat_sum,
    grand_total = EXCLUDED.grand_total,
    status = COALESCE(generated_timesheet_summary.status, EXCLUDED.status),
    generated_by = COALESCE(generated_timesheet_summary.generated_by, EXCLUDED.generated_by),
    edited_by = EXCLUDED.edited_by,
    updated_at = timezone('utc', now()),
    working_days_count = EXCLUDED.working_days_count,
    total_cost_sum = EXCLUDED.total_cost_sum;

  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_timesheet_summary_manual(p_timesheet_month date, p_client_number character varying)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO generated_timesheet_summary (
    timesheet_month, client_number, client_name, employee_count, 
    total_salary_sum, adjusted_salary_sum, etmam_cost_sum, vat_sum, 
    grand_total, status, generated_by, edited_by, created_at, updated_at, 
    working_days_count, total_cost_sum
  )
  SELECT
    t.timesheet_month,
    e.client_number,
    e.client_name,
    COUNT(DISTINCT t.employee_id) AS employee_count,
    COALESCE(SUM(t.total_salary), 0) AS total_salary_sum,
    COALESCE(SUM(COALESCE(t.adjusted_salary, 0)), 0) AS adjusted_salary_sum,
    COALESCE(SUM(COALESCE(t.etmam_cost, 0)), 0) AS etmam_cost_sum,
    COALESCE(SUM(COALESCE(t.vat, 0)), 0) AS vat_sum,
    COALESCE(SUM(COALESCE(t.net_cost, 0)), 0) AS grand_total,
    COALESCE(
      (SELECT status FROM generated_timesheet_summary 
       WHERE timesheet_month = t.timesheet_month AND client_number = e.client_number),
      'draft'
    ) AS status,
    (SELECT MAX(t2.generated_by) FROM generated_timesheet t2 
     WHERE t2.timesheet_month = t.timesheet_month 
     AND t2.employee_id IN (
       SELECT id FROM employees e2 WHERE e2.client_number = e.client_number
     )) AS generated_by,
    (SELECT MAX(t2.edited_by) FROM generated_timesheet t2 
     WHERE t2.timesheet_month = t.timesheet_month 
     AND t2.employee_id IN (
       SELECT id FROM employees e2 WHERE e2.client_number = e.client_number
     )) AS edited_by,
    timezone('utc', now()),
    timezone('utc', now()),
    COALESCE(SUM(t.working_days), 0) AS working_days_count,
    COALESCE(SUM(t.total_cost), 0) AS total_cost_sum
  FROM generated_timesheet t
  JOIN employees e ON t.employee_id = e.id
  WHERE t.timesheet_month = p_timesheet_month
  AND e.client_number = p_client_number
  GROUP BY t.timesheet_month, e.client_number, e.client_name
  ON CONFLICT (timesheet_month, client_number)
  DO UPDATE SET
    client_name = EXCLUDED.client_name,
    employee_count = EXCLUDED.employee_count,
    total_salary_sum = EXCLUDED.total_salary_sum,
    adjusted_salary_sum = EXCLUDED.adjusted_salary_sum,
    etmam_cost_sum = EXCLUDED.etmam_cost_sum,
    vat_sum = EXCLUDED.vat_sum,
    grand_total = EXCLUDED.grand_total,
    status = COALESCE(generated_timesheet_summary.status, EXCLUDED.status),
    generated_by = COALESCE(generated_timesheet_summary.generated_by, EXCLUDED.generated_by),
    edited_by = EXCLUDED.edited_by,
    updated_at = timezone('utc', now()),
    working_days_count = EXCLUDED.working_days_count,
    total_cost_sum = EXCLUDED.total_cost_sum;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE UNIQUE INDEX at_timesheet_summary_idx ON public.at_timesheet_summary USING btree (client_number, at_timesheet_month);

grant delete on table "public"."accommodation_transport" to "anon";

grant insert on table "public"."accommodation_transport" to "anon";

grant references on table "public"."accommodation_transport" to "anon";

grant select on table "public"."accommodation_transport" to "anon";

grant trigger on table "public"."accommodation_transport" to "anon";

grant truncate on table "public"."accommodation_transport" to "anon";

grant update on table "public"."accommodation_transport" to "anon";

grant delete on table "public"."accommodation_transport" to "authenticated";

grant insert on table "public"."accommodation_transport" to "authenticated";

grant references on table "public"."accommodation_transport" to "authenticated";

grant select on table "public"."accommodation_transport" to "authenticated";

grant trigger on table "public"."accommodation_transport" to "authenticated";

grant truncate on table "public"."accommodation_transport" to "authenticated";

grant update on table "public"."accommodation_transport" to "authenticated";

grant delete on table "public"."accommodation_transport" to "service_role";

grant insert on table "public"."accommodation_transport" to "service_role";

grant references on table "public"."accommodation_transport" to "service_role";

grant select on table "public"."accommodation_transport" to "service_role";

grant trigger on table "public"."accommodation_transport" to "service_role";

grant truncate on table "public"."accommodation_transport" to "service_role";

grant update on table "public"."accommodation_transport" to "service_role";

grant delete on table "public"."allowed_emails" to "anon";

grant insert on table "public"."allowed_emails" to "anon";

grant references on table "public"."allowed_emails" to "anon";

grant select on table "public"."allowed_emails" to "anon";

grant trigger on table "public"."allowed_emails" to "anon";

grant truncate on table "public"."allowed_emails" to "anon";

grant update on table "public"."allowed_emails" to "anon";

grant delete on table "public"."allowed_emails" to "authenticated";

grant insert on table "public"."allowed_emails" to "authenticated";

grant references on table "public"."allowed_emails" to "authenticated";

grant select on table "public"."allowed_emails" to "authenticated";

grant trigger on table "public"."allowed_emails" to "authenticated";

grant truncate on table "public"."allowed_emails" to "authenticated";

grant update on table "public"."allowed_emails" to "authenticated";

grant delete on table "public"."allowed_emails" to "service_role";

grant insert on table "public"."allowed_emails" to "service_role";

grant references on table "public"."allowed_emails" to "service_role";

grant select on table "public"."allowed_emails" to "service_role";

grant trigger on table "public"."allowed_emails" to "service_role";

grant truncate on table "public"."allowed_emails" to "service_role";

grant update on table "public"."allowed_emails" to "service_role";

grant delete on table "public"."at_generated_timesheet" to "anon";

grant insert on table "public"."at_generated_timesheet" to "anon";

grant references on table "public"."at_generated_timesheet" to "anon";

grant select on table "public"."at_generated_timesheet" to "anon";

grant trigger on table "public"."at_generated_timesheet" to "anon";

grant truncate on table "public"."at_generated_timesheet" to "anon";

grant update on table "public"."at_generated_timesheet" to "anon";

grant delete on table "public"."at_generated_timesheet" to "authenticated";

grant insert on table "public"."at_generated_timesheet" to "authenticated";

grant references on table "public"."at_generated_timesheet" to "authenticated";

grant select on table "public"."at_generated_timesheet" to "authenticated";

grant trigger on table "public"."at_generated_timesheet" to "authenticated";

grant truncate on table "public"."at_generated_timesheet" to "authenticated";

grant update on table "public"."at_generated_timesheet" to "authenticated";

grant delete on table "public"."at_generated_timesheet" to "service_role";

grant insert on table "public"."at_generated_timesheet" to "service_role";

grant references on table "public"."at_generated_timesheet" to "service_role";

grant select on table "public"."at_generated_timesheet" to "service_role";

grant trigger on table "public"."at_generated_timesheet" to "service_role";

grant truncate on table "public"."at_generated_timesheet" to "service_role";

grant update on table "public"."at_generated_timesheet" to "service_role";

grant delete on table "public"."business_enquiry" to "anon";

grant insert on table "public"."business_enquiry" to "anon";

grant references on table "public"."business_enquiry" to "anon";

grant select on table "public"."business_enquiry" to "anon";

grant trigger on table "public"."business_enquiry" to "anon";

grant truncate on table "public"."business_enquiry" to "anon";

grant update on table "public"."business_enquiry" to "anon";

grant delete on table "public"."business_enquiry" to "authenticated";

grant insert on table "public"."business_enquiry" to "authenticated";

grant references on table "public"."business_enquiry" to "authenticated";

grant select on table "public"."business_enquiry" to "authenticated";

grant trigger on table "public"."business_enquiry" to "authenticated";

grant truncate on table "public"."business_enquiry" to "authenticated";

grant update on table "public"."business_enquiry" to "authenticated";

grant delete on table "public"."business_enquiry" to "service_role";

grant insert on table "public"."business_enquiry" to "service_role";

grant references on table "public"."business_enquiry" to "service_role";

grant select on table "public"."business_enquiry" to "service_role";

grant trigger on table "public"."business_enquiry" to "service_role";

grant truncate on table "public"."business_enquiry" to "service_role";

grant update on table "public"."business_enquiry" to "service_role";

grant delete on table "public"."employee_request" to "anon";

grant insert on table "public"."employee_request" to "anon";

grant references on table "public"."employee_request" to "anon";

grant select on table "public"."employee_request" to "anon";

grant trigger on table "public"."employee_request" to "anon";

grant truncate on table "public"."employee_request" to "anon";

grant update on table "public"."employee_request" to "anon";

grant delete on table "public"."employee_request" to "authenticated";

grant insert on table "public"."employee_request" to "authenticated";

grant references on table "public"."employee_request" to "authenticated";

grant select on table "public"."employee_request" to "authenticated";

grant trigger on table "public"."employee_request" to "authenticated";

grant truncate on table "public"."employee_request" to "authenticated";

grant update on table "public"."employee_request" to "authenticated";

grant delete on table "public"."employee_request" to "service_role";

grant insert on table "public"."employee_request" to "service_role";

grant references on table "public"."employee_request" to "service_role";

grant select on table "public"."employee_request" to "service_role";

grant trigger on table "public"."employee_request" to "service_role";

grant truncate on table "public"."employee_request" to "service_role";

grant update on table "public"."employee_request" to "service_role";

grant delete on table "public"."employees" to "anon";

grant insert on table "public"."employees" to "anon";

grant references on table "public"."employees" to "anon";

grant select on table "public"."employees" to "anon";

grant trigger on table "public"."employees" to "anon";

grant truncate on table "public"."employees" to "anon";

grant update on table "public"."employees" to "anon";

grant delete on table "public"."employees" to "authenticated";

grant insert on table "public"."employees" to "authenticated";

grant references on table "public"."employees" to "authenticated";

grant select on table "public"."employees" to "authenticated";

grant trigger on table "public"."employees" to "authenticated";

grant truncate on table "public"."employees" to "authenticated";

grant update on table "public"."employees" to "authenticated";

grant delete on table "public"."employees" to "service_role";

grant insert on table "public"."employees" to "service_role";

grant references on table "public"."employees" to "service_role";

grant select on table "public"."employees" to "service_role";

grant trigger on table "public"."employees" to "service_role";

grant truncate on table "public"."employees" to "service_role";

grant update on table "public"."employees" to "service_role";

grant delete on table "public"."etmam_staff" to "anon";

grant insert on table "public"."etmam_staff" to "anon";

grant references on table "public"."etmam_staff" to "anon";

grant select on table "public"."etmam_staff" to "anon";

grant trigger on table "public"."etmam_staff" to "anon";

grant truncate on table "public"."etmam_staff" to "anon";

grant update on table "public"."etmam_staff" to "anon";

grant delete on table "public"."etmam_staff" to "authenticated";

grant insert on table "public"."etmam_staff" to "authenticated";

grant references on table "public"."etmam_staff" to "authenticated";

grant select on table "public"."etmam_staff" to "authenticated";

grant trigger on table "public"."etmam_staff" to "authenticated";

grant truncate on table "public"."etmam_staff" to "authenticated";

grant update on table "public"."etmam_staff" to "authenticated";

grant delete on table "public"."etmam_staff" to "service_role";

grant insert on table "public"."etmam_staff" to "service_role";

grant references on table "public"."etmam_staff" to "service_role";

grant select on table "public"."etmam_staff" to "service_role";

grant trigger on table "public"."etmam_staff" to "service_role";

grant truncate on table "public"."etmam_staff" to "service_role";

grant update on table "public"."etmam_staff" to "service_role";

grant delete on table "public"."generated_timesheet" to "anon";

grant insert on table "public"."generated_timesheet" to "anon";

grant references on table "public"."generated_timesheet" to "anon";

grant select on table "public"."generated_timesheet" to "anon";

grant trigger on table "public"."generated_timesheet" to "anon";

grant truncate on table "public"."generated_timesheet" to "anon";

grant update on table "public"."generated_timesheet" to "anon";

grant delete on table "public"."generated_timesheet" to "authenticated";

grant insert on table "public"."generated_timesheet" to "authenticated";

grant references on table "public"."generated_timesheet" to "authenticated";

grant select on table "public"."generated_timesheet" to "authenticated";

grant trigger on table "public"."generated_timesheet" to "authenticated";

grant truncate on table "public"."generated_timesheet" to "authenticated";

grant update on table "public"."generated_timesheet" to "authenticated";

grant delete on table "public"."generated_timesheet" to "service_role";

grant insert on table "public"."generated_timesheet" to "service_role";

grant references on table "public"."generated_timesheet" to "service_role";

grant select on table "public"."generated_timesheet" to "service_role";

grant trigger on table "public"."generated_timesheet" to "service_role";

grant truncate on table "public"."generated_timesheet" to "service_role";

grant update on table "public"."generated_timesheet" to "service_role";

grant delete on table "public"."generated_timesheet_summary" to "anon";

grant insert on table "public"."generated_timesheet_summary" to "anon";

grant references on table "public"."generated_timesheet_summary" to "anon";

grant select on table "public"."generated_timesheet_summary" to "anon";

grant trigger on table "public"."generated_timesheet_summary" to "anon";

grant truncate on table "public"."generated_timesheet_summary" to "anon";

grant update on table "public"."generated_timesheet_summary" to "anon";

grant delete on table "public"."generated_timesheet_summary" to "authenticated";

grant insert on table "public"."generated_timesheet_summary" to "authenticated";

grant references on table "public"."generated_timesheet_summary" to "authenticated";

grant select on table "public"."generated_timesheet_summary" to "authenticated";

grant trigger on table "public"."generated_timesheet_summary" to "authenticated";

grant truncate on table "public"."generated_timesheet_summary" to "authenticated";

grant update on table "public"."generated_timesheet_summary" to "authenticated";

grant delete on table "public"."generated_timesheet_summary" to "service_role";

grant insert on table "public"."generated_timesheet_summary" to "service_role";

grant references on table "public"."generated_timesheet_summary" to "service_role";

grant select on table "public"."generated_timesheet_summary" to "service_role";

grant trigger on table "public"."generated_timesheet_summary" to "service_role";

grant truncate on table "public"."generated_timesheet_summary" to "service_role";

grant update on table "public"."generated_timesheet_summary" to "service_role";

grant delete on table "public"."job_applicant" to "anon";

grant insert on table "public"."job_applicant" to "anon";

grant references on table "public"."job_applicant" to "anon";

grant select on table "public"."job_applicant" to "anon";

grant trigger on table "public"."job_applicant" to "anon";

grant truncate on table "public"."job_applicant" to "anon";

grant update on table "public"."job_applicant" to "anon";

grant delete on table "public"."job_applicant" to "authenticated";

grant insert on table "public"."job_applicant" to "authenticated";

grant references on table "public"."job_applicant" to "authenticated";

grant select on table "public"."job_applicant" to "authenticated";

grant trigger on table "public"."job_applicant" to "authenticated";

grant truncate on table "public"."job_applicant" to "authenticated";

grant update on table "public"."job_applicant" to "authenticated";

grant delete on table "public"."job_applicant" to "service_role";

grant insert on table "public"."job_applicant" to "service_role";

grant references on table "public"."job_applicant" to "service_role";

grant select on table "public"."job_applicant" to "service_role";

grant trigger on table "public"."job_applicant" to "service_role";

grant truncate on table "public"."job_applicant" to "service_role";

grant update on table "public"."job_applicant" to "service_role";

grant delete on table "public"."job_list" to "anon";

grant insert on table "public"."job_list" to "anon";

grant references on table "public"."job_list" to "anon";

grant select on table "public"."job_list" to "anon";

grant trigger on table "public"."job_list" to "anon";

grant truncate on table "public"."job_list" to "anon";

grant update on table "public"."job_list" to "anon";

grant delete on table "public"."job_list" to "authenticated";

grant insert on table "public"."job_list" to "authenticated";

grant references on table "public"."job_list" to "authenticated";

grant select on table "public"."job_list" to "authenticated";

grant trigger on table "public"."job_list" to "authenticated";

grant truncate on table "public"."job_list" to "authenticated";

grant update on table "public"."job_list" to "authenticated";

grant delete on table "public"."job_list" to "service_role";

grant insert on table "public"."job_list" to "service_role";

grant references on table "public"."job_list" to "service_role";

grant select on table "public"."job_list" to "service_role";

grant trigger on table "public"."job_list" to "service_role";

grant truncate on table "public"."job_list" to "service_role";

grant update on table "public"."job_list" to "service_role";

grant delete on table "public"."logs" to "anon";

grant insert on table "public"."logs" to "anon";

grant references on table "public"."logs" to "anon";

grant select on table "public"."logs" to "anon";

grant trigger on table "public"."logs" to "anon";

grant truncate on table "public"."logs" to "anon";

grant update on table "public"."logs" to "anon";

grant delete on table "public"."logs" to "authenticated";

grant insert on table "public"."logs" to "authenticated";

grant references on table "public"."logs" to "authenticated";

grant select on table "public"."logs" to "authenticated";

grant trigger on table "public"."logs" to "authenticated";

grant truncate on table "public"."logs" to "authenticated";

grant update on table "public"."logs" to "authenticated";

grant delete on table "public"."logs" to "service_role";

grant insert on table "public"."logs" to "service_role";

grant references on table "public"."logs" to "service_role";

grant select on table "public"."logs" to "service_role";

grant trigger on table "public"."logs" to "service_role";

grant truncate on table "public"."logs" to "service_role";

grant update on table "public"."logs" to "service_role";

grant delete on table "public"."quotations" to "anon";

grant insert on table "public"."quotations" to "anon";

grant references on table "public"."quotations" to "anon";

grant select on table "public"."quotations" to "anon";

grant trigger on table "public"."quotations" to "anon";

grant truncate on table "public"."quotations" to "anon";

grant update on table "public"."quotations" to "anon";

grant delete on table "public"."quotations" to "authenticated";

grant insert on table "public"."quotations" to "authenticated";

grant references on table "public"."quotations" to "authenticated";

grant select on table "public"."quotations" to "authenticated";

grant trigger on table "public"."quotations" to "authenticated";

grant truncate on table "public"."quotations" to "authenticated";

grant update on table "public"."quotations" to "authenticated";

grant delete on table "public"."quotations" to "service_role";

grant insert on table "public"."quotations" to "service_role";

grant references on table "public"."quotations" to "service_role";

grant select on table "public"."quotations" to "service_role";

grant trigger on table "public"."quotations" to "service_role";

grant truncate on table "public"."quotations" to "service_role";

grant update on table "public"."quotations" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Allow inserts for all"
  on "public"."job_applicant"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow insert for all"
  on "public"."users"
  as permissive
  for insert
  to public
with check (true);


CREATE TRIGGER trg_update_accommodation_transport_updated_at BEFORE UPDATE ON public.accommodation_transport FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_refresh_at_timesheet_summary AFTER INSERT OR DELETE OR UPDATE ON public.at_generated_timesheet FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_at_timesheet_summary();

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.at_generated_timesheet FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.business_enquiry FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER employee_status_change_trigger AFTER UPDATE OF employee_status ON public.employees FOR EACH ROW EXECUTE FUNCTION public.log_employee_status_change();

CREATE TRIGGER normalize_employees_status_trigger BEFORE INSERT OR UPDATE OF employee_status ON public.employees FOR EACH ROW EXECUTE FUNCTION public.normalize_employees_status();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_prevent_employee_delete BEFORE DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.prevent_employee_hard_delete();

CREATE TRIGGER update_etmam_staff_updated_at BEFORE UPDATE ON public.etmam_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_generated_timesheet_salaries BEFORE INSERT OR UPDATE OF employee_id ON public.generated_timesheet FOR EACH ROW EXECUTE FUNCTION public.set_salary_fields();

CREATE TRIGGER trg_preserve_generated_by BEFORE UPDATE ON public.generated_timesheet FOR EACH ROW EXECUTE FUNCTION public.preserve_generated_by();

CREATE TRIGGER update_generated_timesheet_updated_at BEFORE UPDATE ON public.generated_timesheet FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timesheet_summary_trigger AFTER INSERT OR DELETE OR UPDATE ON public.generated_timesheet FOR EACH ROW EXECUTE FUNCTION public.update_timesheet_summary();

CREATE TRIGGER update_generated_timesheet_summary_updated_at BEFORE UPDATE ON public.generated_timesheet_summary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.job_list FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_quotation_timestamp BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


  create policy "Policy for 'job_applicant_cvs' aiy9i9_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'job_applicant_cvs'::text));



  create policy "Policy for 'job_applicant_cvs' aiy9i9_1"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'job_applicant_cvs'::text));



  create policy "Policy for 'job_applicant_cvs' aiy9i9_2"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'job_applicant_cvs'::text));



  create policy "Policy for 'job_applicant_cvs' aiy9i9_3"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'job_applicant_cvs'::text));



