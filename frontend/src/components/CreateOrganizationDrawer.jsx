import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { createOrganization, addSubordinate } from "../api/dashboardApi";

const defaultFormState = {
  name: "",
  subordinateEmail: "",
};

const CreateOrganizationDrawer = ({ open, onClose, token, onCreated }) => {
  const [formValues, setFormValues] = useState(defaultFormState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setError("");
      setFormValues(defaultFormState);
    }
  }, [open]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    setError("");
    setFormValues(defaultFormState);
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!token) {
      setError("Authentication required to create organizations.");
      return;
    }

    const name = formValues.name.trim();
    const subordinateEmail = formValues.subordinateEmail.trim();

    if (!name) {
      setError("Organization name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await createOrganization(token, name);
      const createdOrg = response?.org || response;

      if (!createdOrg?.id) {
        throw new Error("Organization identifier missing in response");
      }

      let subordinateFailed = false;

      if (subordinateEmail) {
        try {
          await addSubordinate(token, createdOrg.id, subordinateEmail, "SUB_ADMIN");
        } catch (subordinateError) {
          subordinateFailed = true;
          console.error("Failed to add subordinate", subordinateError);
        }
      }

      onCreated?.(createdOrg);
      setFormValues(defaultFormState);
      onClose?.();

      if (subordinateEmail && subordinateFailed && typeof window !== "undefined") {
        window.alert(
          "Organization created, but adding the subordinate failed. You can invite them later from the organization view."
        );
      }
    } catch (creationError) {
      console.error("Error creating organization", creationError);
      setError("Unable to create organization right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="translate-x-full opacity-0"
          enterTo="translate-x-0 opacity-100"
          leave="ease-in duration-200"
          leaveFrom="translate-x-0 opacity-100"
          leaveTo="translate-x-full opacity-0"
        >
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl p-6 overflow-y-auto">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Create Organization
            </Dialog.Title>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <input
                type="text"
                placeholder="Organization Name"
                className="w-full border rounded p-2"
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                disabled={isSubmitting}
              />

              <input
                type="email"
                placeholder="Subordinate Email (optional)"
                className="w-full border rounded p-2"
                value={formValues.subordinateEmail}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    subordinateEmail: event.target.value,
                  }))
                }
                disabled={isSubmitting}
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="border px-4 py-2 rounded disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
};

export default CreateOrganizationDrawer;
