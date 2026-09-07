import React, { useState } from "react";
import { localClient } from "@/api/localClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const statusOptions = [
  { value: "on_track", label: "On Track" },
  { value: "blocked", label: "Blocked" },
  { value: "need_help", label: "Need Help" },
  { value: "done", label: "Done" },
];

export default function StatusUpdateForm({ task, user, onSubmit }) {
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!status) return;
    setLoading(true);
    try {
      // Log the update (best-effort — RLS may restrict by role)
      try {
        await localClient.entities.Update.create({
          task_id: task.id,
          task_title: task.title,
          user_id: user?.id,
          user_name: user?.full_name || user?.email,
          status,
          message
        });
      } catch (_) {}

      // Update task status to match
      const taskStatusMap = { on_track: "in_progress", blocked: "blocked", need_help: "need_help", done: "done" };
      await localClient.entities.Task.update(task.id, { status: taskStatusMap[status] });

      // Auto-complete goal if all tasks are done; revert to active if not (best-effort)
      if (task.goal_id) {
        try {
          const allGoalTasks = await localClient.entities.Task.filter({ goal_id: task.goal_id });
          const taskStatusMap2 = { on_track: "in_progress", blocked: "blocked", need_help: "need_help", done: "done" };
          const allDone = allGoalTasks.every(t => t.id === task.id ? taskStatusMap2[status] === "done" : t.status === "done");
          if (allDone && allGoalTasks.length > 0) {
            await localClient.entities.Goal.update(task.goal_id, { status: "completed" });
          } else {
            const goal = await localClient.entities.Goal.filter({ id: task.goal_id });
            if (goal[0]?.status === "completed") {
              await localClient.entities.Goal.update(task.goal_id, { status: "active" });
            }
          }
        } catch (_) {}
      }

      // Log activity (best-effort)
      try {
        await localClient.entities.AgentActivity.create({
          action_type: "status_checked",
          title: `${user?.full_name || "Team member"} updated "${task.title}"`,
          description: `Status: ${status}${message ? ` — "${message}"` : ""}`,
          related_task_id: task.id
        });
      } catch (_) {}

      setStatus("");
      setMessage("");
      onSubmit?.();
    } catch (err) {
      const isPermission = err?.message?.toLowerCase().includes("permission") || err?.message?.toLowerCase().includes("forbidden") || err?.status === 403;
      toast({
        title: isPermission ? "Permission denied" : "Failed to update status",
        description: isPermission
          ? "You don't have permission to update this task. Contact your team lead."
          : err?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <RadioGroup value={status} onValueChange={setStatus} className="grid grid-cols-2 gap-2">
        {statusOptions.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={opt.value} />
            <Label htmlFor={opt.value} className="text-sm cursor-pointer">
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <Textarea
        placeholder="Add a note (optional)..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="h-20"
      />
      <Button onClick={handleSubmit} disabled={!status || loading} size="sm">
        {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
        Post Update
      </Button>
    </div>
  );
}