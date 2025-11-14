"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Search } from "lucide-react";
import BusinessEnquiryActions from "@/component/BusinessEnquiryActions";
import ViewModal from "@/component/business_enquiry_actions/ViewModal";
import StatusModal from "@/component/business_enquiry_actions/StatusModal";

export default function BusinessEnquiryPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedViewEnquiry, setSelectedViewEnquiry] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // 🔹 Fetch data
  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/sales/business_enquiry_private?search=${encodeURIComponent(
          searchTerm
        )}`,
        { cache: "no-cache" }
      );
      const result = await res.json();
      console.log(result.enquiries);
      if (result.success) {
        setEnquiries(result.enquiries || []);
        setError(null);
      } else {
        setError(result.error || "Failed to load enquiries");
      }
    } catch (err) {
      setError("Something went wrong while fetching data");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Auto search with debounce
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchEnquiries();
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  async function handleAction(action, enquiry) {
    switch (action) {
      case "view":
        setSelectedViewEnquiry(enquiry);
        setIsViewModalOpen(true);
        break;

      case "assign":
        toast(`Assigning ${enquiry.company_name}`);
        break;

      case "updateStatus":
        setSelectedEnquiry(enquiry);
        setIsStatusDialogOpen(true);
        break;

      case "delete":
        try {
          const confirmDelete = window.confirm(
            "Are you sure you want to delete?"
          );
          if (!confirmDelete) return;

          const res = await fetch(
            `/api/sales/business_enquiry_private/${enquiry.id}`,
            { method: "DELETE" }
          );

          const result = await res.json();
          if (result.success) {
            toast.success("Deleted successfully");
            fetchEnquiries();
          } else {
            toast.error(result.error || "Failed to delete");
          }
        } catch (err) {
          console.error("Delete error:", err);
          toast.error("Something went wrong");
        }
        break;

      default:
        toast.error("Unknown action");
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-2">
      <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        💼 Business Enquiries
      </h1>

      {/* 🔍 Search Bar */}
      <div className="flex flex-wrap justify-center items-center gap-4 mb-8 w-full">
        <div className="relative w-[85%] sm:w-72 md:w-96">
          <Search
            className="absolute left-3 top-2.5 text-gray-400 pointer-events-none z-10"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full shadow-sm md:shadow-md md:hover:shadow-lg pl-10 pr-4 py-2 rounded-lg bg-white/10 text-gray-800 placeholder-gray-400
              border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A5A6A]/60
              focus:border-transparent transition-all duration-200 backdrop-blur-sm
              hover:bg-white/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ⚠️ Error */}
      {error && (
        <div className="max-w-lg mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-center mb-4">
          {error}
        </div>
      )}

      {/* ⏳ Shimmer Loader */}
      {loading && (
        <div className="space-y-4 my-10 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-6 border rounded-lg shadow bg-gray-100/60 backdrop-blur-sm"
            >
              <div className="h-5 w-2/3 bg-gray-300 rounded mb-3"></div>
              <div className="h-4 w-1/3 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-300 rounded mb-4"></div>
              <div className="h-3 w-full bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* 🧩 Data Display */}
      {!loading && (
        <>
          {enquiries.length === 0 ? (
            <p className="text-center text-gray-600 fade-in">
              {searchTerm
                ? `No results found for “${searchTerm}”.`
                : "No business enquiries found."}
            </p>
          ) : (
            <>
              {/* 💻 Desktop Table */}
              <div className="hidden md:block overflow-x-auto border border-gray-400 rounded-lg shadow-sm">
                <table className="min-w-full text-sm border-collapse border border-gray-200">
                  <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 border border-gray-200 text-left">
                        S.N.
                      </th>
                      <th className="px-4 py-3 border border-gray-200 text-left">
                        Company Name
                      </th>
                      <th className="px-4 py-3 border border-gray-200 text-left">
                        Contact Person
                      </th>
                      <th className="px-4 py-3 border border-gray-200 text-left">
                        CR Number
                      </th>
                      <th className="px-4 py-3 border border-gray-200 text-left">
                        Mobile No
                      </th>
                      <th className="px-4 py-3 border border-gray-200 text-left">
                        Email
                      </th>
                      <th className="px-4 py-3 border border-gray-200 text-left">
                        Created At
                      </th>
                      <th className="px-4 py-3 border border-gray-200 text-left">
                        Status
                      </th>
                      <th className="px-4 py-3 border border-gray-200 text-left">
                        Remarks
                      </th>
                      <th className="py-3 px-4 border border-gray-200 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border border-gray-200">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 border border-gray-200 font-medium">
                          {item.company_name}
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          {item.contact_person_name}
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          {item.company_cr_number}
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          {item.mobile_no}
                        </td>
                        <td className="px-4 py-3 border border-gray-200 text-gray-700">
                          {item.email_id}
                        </td>

                        <td className="px-4 py-3 border border-gray-200 text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 border border-gray-200 text-gray-500">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.status === "converted"
                                ? "bg-green-200 text-green-700"
                                : item.status === "in_progress"
                                ? "bg-yellow-200 text-yellow-700"
                                : item.status === "contacted"
                                ? "bg-blue-200 text-blue-700"
                                : item.status === "rejected"
                                ? "bg-red-200 text-red-700"
                                : "bg-rose-200 text-gray-700"
                            }`}
                          >
                            {item.status || "New"}
                          </span>
                        </td>
                        <td className="px-4 py-3 border border-gray-200 text-gray-700">
                          {item.remarks}
                        </td>
                        <td className="py-3 px-4 border border-gray-200 text-right">
                          <BusinessEnquiryActions
                            enquiry={item}
                            onAction={handleAction}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 📱 Mobile Cards */}
              <div className="md:hidden space-y-3 mt-4">
                {enquiries.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-gray-500">SN: {idx + 1}</p>
                        <h3 className="font-semibold text-base">
                          {item.company_name}
                        </h3>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Contact:</span>
                        <p>{item.contact_person_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">CR No:</span>
                        <p>{item.company_cr_number}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Mobile:</span>
                        <p>{item.mobile_no}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="break-all">{item.email_id}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Request Type:</span>
                        <p>{item.request_type}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Description:</span>
                        <p>{item.description || "-"}</p>
                      </div>
                    </div>

                    {/* ✅ Status & Actions Section */}
                    <div className="mt-4 flex items-center justify-between">
                      {/* Status */}
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          item.status === "converted"
                            ? "bg-green-200 text-green-700"
                            : item.status === "in_progress"
                            ? "bg-yellow-100 text-orange-700"
                            : item.status === "contacted"
                            ? "bg-blue-200 text-blue-700"
                            : item.status === "rejected"
                            ? "bg-red-200 text-red-700"
                            : "bg-pink-200 text-gray-700"
                        }`}
                      >
                        {item.status || "New"}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <BusinessEnquiryActions
                          enquiry={item}
                          onAction={handleAction}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <StatusModal
        open={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        enquiry={selectedEnquiry}
        onUpdated={fetchEnquiries}
      />
      <ViewModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        enquiry={selectedViewEnquiry}
      />
    </div>
  );
}
