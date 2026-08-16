import React, { useState } from "react";
import { localClient } from "@/api/localClient";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, ArrowRight, Loader2, Plus, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AiAvatar from "../components/shared/AiAvatar";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [members, setMembers] = useState([{ name: "", email: "" }]);
  const [loading, setLoading] = useState(false);

  const addMember = () => setMembers([...members, { name: "", email: "" }]);
  const removeMember = (i) => setMembers(members.filter((_, idx) => idx !== i));
  const updateMember = (i, field, value) => {
    const updated = [...members];
    updated[i] = { ...updated[i], [field]: value };
    setMembers(updated);
  };

  const handleSetup = async () => {
    setLoading(true);
    await localClient.auth.updateMe({
      workspace_name: workspaceName,
      onboarded: true,
      role: "lead",
      settings: {
        ping_frequency: "daily",
        working_hours_start: "09:00",
        working_hours_end: "17:00",
        ai_tone: "friendly",
      }
    });

    // Invite members
    const validMembers = members.filter(m => m.email);
    for (const member of validMembers) {
      await localClient.users.inviteUser(member.email, "user");
    }

    await localClient.entities.AgentActivity.create({
      action_type: "goal_analyzed",
      title: `Workspace "${workspaceName}" created`,
      description: `Team lead set up the workspace and invited ${validMembers.length} team member${validMembers.length !== 1 ? "s" : ""}.`
    });

    queryClient.invalidateQueries({ queryKey: ["me"] });
    setLoading(false);
    navigate("/goals?new=true");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">AgentPM</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="p-8">
                <div className="flex items-start gap-3 mb-6">
                  <AiAvatar />
                  <div className="bg-muted rounded-xl rounded-tl-none px-4 py-3">
                    <p className="text-sm text-foreground">Welcome! I'm your AI project manager. Let's set up your workspace. What's your team called?</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Workspace Name</Label>
                    <Input
                      placeholder="e.g., Product Team, Engineering, Marketing"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <Button onClick={() => setStep(1)} disabled={!workspaceName} className="w-full">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="p-8">
                <div className="flex items-start gap-3 mb-6">
                  <AiAvatar />
                  <div className="bg-muted rounded-xl rounded-tl-none px-4 py-3">
                    <p className="text-sm text-foreground">Who's on your team? I'll need their emails to assign tasks and send check-ins.</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  {members.map((m, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Name"
                          value={m.name}
                          onChange={(e) => updateMember(i, "name", e.target.value)}
                        />
                        <Input
                          type="email"
                          placeholder="email@company.com"
                          value={m.email}
                          onChange={(e) => updateMember(i, "email", e.target.value)}
                        />
                      </div>
                      {members.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeMember(i)} className="flex-shrink-0">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addMember} className="mb-4">
                  <Plus className="w-4 h-4 mr-2" /> Add Member
                </Button>
                <Button onClick={handleSetup} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Set Up & Create First Goal
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-center text-muted-foreground mt-6">You can always invite more people later from the Team page.</p>
      </div>
    </div>
  );
}