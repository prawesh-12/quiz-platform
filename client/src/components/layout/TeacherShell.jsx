import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { Button } from "@/components/ui/button";

export default function TeacherShell({
    children,
    subjects,
    selectedSubjectId,
    onSelectSubject,
    onOpenCreateSubject,
    onOpenProfile,
    user,
    onLogout,
    showBackButton = true,
}) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f3f5fb] md:h-screen">
            <TeacherSidebar
                subjects={subjects}
                selectedSubjectId={selectedSubjectId}
                onSelectSubject={onSelectSubject}
                onOpenCreateSubject={onOpenCreateSubject}
                onOpenProfile={onOpenProfile}
                user={user}
                onLogout={onLogout}
            />
            <main className="flex min-h-screen flex-col pl-0 md:ml-[19.5rem] md:h-screen md:overflow-hidden">
                <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-7">
                    <div className="pointer-events-none absolute inset-x-7 top-0 h-44 rounded-b-[2.5rem] bg-gradient-to-b from-[#fff0ea] via-[#fff6f2] to-transparent" />
                    {showBackButton ? (
                        <div className="relative mb-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-[#d9deed] bg-white text-[#1f2542] shadow-sm hover:bg-[#f9faff]"
                                onClick={() => navigate("/teacher")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </div>
                    ) : null}
                    <div className="relative">{children}</div>
                </div>
            </main>
        </div>
    );
}
