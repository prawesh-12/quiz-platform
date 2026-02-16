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
        <div className="min-h-screen bg-muted/30 md:h-screen">
            <TeacherSidebar
                subjects={subjects}
                selectedSubjectId={selectedSubjectId}
                onSelectSubject={onSelectSubject}
                onOpenCreateSubject={onOpenCreateSubject}
                onOpenProfile={onOpenProfile}
                user={user}
                onLogout={onLogout}
            />
            <main className="flex min-h-screen flex-col pl-0 md:ml-72 md:h-screen md:overflow-hidden">
                <div className="flex flex-1 flex-col p-4 md:p-6 overflow-y-auto">
                    {showBackButton ? (
                        <div className="mb-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/teacher")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </div>
                    ) : null}
                    {children}
                </div>
            </main>
        </div>
    );
}
