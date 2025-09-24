import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function POST(req) {
  try {
    const formData = await req.formData();

    // Extract fields
    const applicantName = formData.get("applicantName");
    const applicantMobileNo = formData.get("applicantMobileNo");
    const applicantNationality = formData.get("applicantNationality");
    const applicantPassportIqama = formData.get("applicantPassportIqama");
    const applicantCity = formData.get("applicantCity");
    const applicantExperienceYears = formData.get("applicantExperienceYears");
    const applicantIsNoticePeriod =
      formData.get("applicantIsNoticePeriod") === "Yes";
    const applicantNoticePeriodDays = formData.get("applicantNoticePeriodDays");
    const applicantCurrentSalary = formData.get("applicantCurrentSalary");
    const applicantExpectedSalary = formData.get("applicantExpectedSalary");
    const applicantDescription = formData.get("applicantDescription");

    let applicantCVUrl = null;

    // ✅ Handle file upload
    const file = formData.get("applicantCV");
    if (file && typeof file === "object" && file.name) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("job_applicant_cvs")
        .upload(fileName, file, {
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from("job_applicant_cvs")
        .getPublicUrl(fileName);

      applicantCVUrl = urlData.publicUrl;
    }
    const jobId = formData.get("jobId");

    // ✅ Insert into DB
    const { error: insertError } = await supabase.from("job_applicant").insert([
      {
        applicant_name: applicantName,
        applicant_mobile_no: applicantMobileNo,
        applicant_nationality: applicantNationality,
        applicant_passport_iqama: applicantPassportIqama,
        applicant_city: applicantCity,
        applicant_experience_years: applicantExperienceYears,
        applicant_is_notice_period: applicantIsNoticePeriod,
        applicant_notice_period_days: applicantNoticePeriodDays,
        applicant_current_salary: applicantCurrentSalary,
        applicant_expected_salary: applicantExpectedSalary,
        applicant_cv_url: applicantCVUrl,
        applicant_description: applicantDescription,
        job_id: jobId,
      },
    ]);

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
