
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";

import GroupForm from "../components/GroupForm";
import groupService from "../services/groupService";

export default function GroupCreatePage() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(values) {
    setSaving(true);
    setError("");

    try {
      await groupService.create(values);
      navigate("/groups", {
        replace: true,
        state: { success: "Group created successfully." },
      });

      return true;
    } catch (err) {
      setError(err.message || "Unable to create group.");
      return false;
    } finally {
      setSaving(false);
    }
  }


  // SEO METADATA
  useEffect(() => {
    const previousTitle = document.title;

    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );
    const robotsMeta = document.querySelector(
      'meta[name="robots"]'
    );

    const previousDescription = descriptionMeta?.content;
    const previousRobots = robotsMeta?.content;

    const description =
      descriptionMeta || document.createElement("meta");
    const robots =
      robotsMeta || document.createElement("meta");

    document.title = "Create Customer Group | Amrit Jal";

    description.name = "description";
    description.content =
      "Create customer groups in Amrit Jal to organize customers by village, area and delivery route for efficient water delivery management.";

    robots.name = "robots";
    robots.content = "noindex, nofollow";

    if (!descriptionMeta) document.head.appendChild(description);
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        description.content = previousDescription || "";
      } else {
        description.remove();
      }

      if (robotsMeta) {
        robots.content = previousRobots || "";
      } else {
        robots.remove();
      }
    };
  }, []);


  return (
    <main className="min-h-screen bg-[#F3F7F8] p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => navigate("/groups")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#087F8C]"
        >
          <ArrowLeft size={17} />
          Back to Groups
        </button>

        <section className="rounded-2xl border border-[#DCE8EA] bg-white p-5 shadow-sm sm:p-8">
          <h1 className="mb-1 text-xl font-bold text-[#102D3A]">
            Create Customer Group
          </h1>

          <p className="mb-6 text-sm text-[#8299A5]">
            Create a new delivery area or customer group.
          </p>

          {error && (
            <div className="mb-5 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <GroupForm
            onSubmit={handleCreate}
            onCancel={() => navigate("/groups")}
            saving={saving}
          />
        </section>
      </div>
    </main>
  );
}
