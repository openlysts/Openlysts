import React, { useState } from "react";
import { localClient } from "@/api/localClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import AiAvatar from "../shared/AiAvatar";
import { motion, AnimatePresence } from "framer-motion";

const neuInset = {
  background: '#ebe7e2',
  boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.22)',
  borderRadius: 10,
  border: 'none',
  outline: 'none',
  width: '100%',
  fontSize: 13,
  color: '#3a3a3a',
  boxSizing: 'border-box',
};

const NeuInput = ({ style, ...props }) => (
  <input {...props} style={{ ...neuInset, padding: '9px 14px', ...style }} />
);

const NeuTextarea = ({ style, ...props }) => (
  <textarea {...props} style={{ ...neuInset, padding: '10px 14px', resize: 'vertical', fontFamily: 'inherit', ...style }} />
);

const FieldLabel = ({ children }) => (
  <p style={{ fontSize: 12, fontWeight: 600, color: '#6e6e6e', letterSpacing: '0.04em', marginBottom: 7 }}>{children}</p>
);

const NeuBtn = ({ children, onClick, disabled, dark, style }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '9px 18px', borderRadius: 10, border: 'none', cursor: disabled ? 'default' : 'pointer',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
      transition: 'box-shadow 0.15s ease',
      opacity: disabled ? 0.5 : 1,
      ...(dark ? {
        background: '#3a3a3a',
        color: '#f1f1f0',
        boxShadow: '-4px -4px 8px rgba(255,255,255,0.085), 4px 4px 10px rgba(0,0,0,0.30)',
      } : {
        background: '#eeeae6',
        color: '#3a3a3a',
        boxShadow: '-5px -5px 10px rgba(255,250,244,0.78), 5px 5px 12px rgba(160,143,126,0.27)',
      }),
      ...style,
    }}
  >
    {children}
  </button>
);

export default function GoalCreationWizard({ teamMembers, onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [targetDate, setTargetDate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [proposedTasks, setProposedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [goalId, setGoalId] = useState(null);

  const generateQuestions = async () => {
    setLoading(true);
    const memberNames = teamMembers.map(m => m.full_name || m.email).join(", ");
    const res = await localClient.integrations.Core.InvokeLLM({
      prompt: `You are a smart project management AI. A team lead wants to create a goal:
Title: "${goalTitle}"
Description: "${goalDescription}"
Target Date: ${targetDate ? format(targetDate, "yyyy-MM-dd") : "Not set"}
Team Members: ${memberNames || "Not specified yet"}

Generate exactly 3 short, focused clarifying questions to better understand scope, priorities, and constraints before breaking this into tasks. Questions should be practical and help create actionable tasks.

Return as JSON.`,
      response_json_schema: {
        type: "object",
        properties: { questions: { type: "array", items: { type: "string" } } }
      }
    });
    setQuestions(res.questions || []);
    setStep(1);
    setLoading(false);
  };

  const generateTasks = async () => {
    setLoading(true);
    const memberInfo = teamMembers.map(m => ({ id: m.id, name: m.full_name || m.email, email: m.email }));
    const qaPairs = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || "No answer"}`).join("\n\n");

    const goal = await localClient.entities.Goal.create({
      title: goalTitle,
      description: goalDescription,
      status: "draft",
      target_date: targetDate ? format(targetDate, "yyyy-MM-dd") : undefined,
      clarifying_questions: questions.map((q, i) => ({ question: q, answer: answers[i] || "" })),
      ai_context: qaPairs
    });
    setGoalId(goal.id);

    await localClient.entities.AgentActivity.create({
      action_type: "goal_analyzed",
      title: `Analyzed goal: ${goalTitle}`,
      description: `Asked 3 clarifying questions and received answers to understand scope and priorities.`,
      related_goal_id: goal.id
    });

    const res = await localClient.integrations.Core.InvokeLLM({
      prompt: `You are a project management AI. Break down this goal into actionable tasks.

Goal: "${goalTitle}"
Description: "${goalDescription}"
Target Date: ${targetDate ? format(targetDate, "yyyy-MM-dd") : "End of month"}

Context from clarifying questions:
${qaPairs}

Available team members: ${JSON.stringify(memberInfo)}

Create 4-8 tasks. For each task, suggest the best assignee based on a balanced workload (spread evenly). Set realistic deadlines working backwards from the target date. Give estimated hours for each task.

Return as JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                assignee_id: { type: "string" },
                assignee_name: { type: "string" },
                assignee_email: { type: "string" },
                deadline: { type: "string" },
                estimated_hours: { type: "number" }
              }
            }
          }
        }
      }
    });

    setProposedTasks(res.tasks || []);
    setStep(2);
    setLoading(false);
  };

  const approveAndCreate = async () => {
    setLoading(true);
    await localClient.entities.Goal.update(goalId, { status: "active" });
    const taskPromises = proposedTasks.map((t, i) =>
      localClient.entities.Task.create({
        title: t.title,
        description: t.description,
        goal_id: goalId,
        goal_title: goalTitle,
        assignee_id: t.assignee_id,
        assignee_name: t.assignee_name,
        assignee_email: t.assignee_email,
        deadline: t.deadline,
        estimated_hours: t.estimated_hours,
        status: "pending",
        created_by_ai: true,
        order: i
      })
    );
    await Promise.all(taskPromises);
    await localClient.entities.AgentActivity.create({
      action_type: "tasks_generated",
      title: `Generated ${proposedTasks.length} tasks for "${goalTitle}"`,
      description: `AI created and assigned ${proposedTasks.length} tasks across team members with deadlines.`,
      related_goal_id: goalId
    });
    setLoading(false);
    onComplete();
  };

  const updateTask = (index, field, value) => {
    setProposedTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <AnimatePresence mode="wait">

        {/* ── Step 0: Describe goal ── */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-start gap-3 mb-6">
              <AiAvatar />
              <div style={{
                background: '#eeeae6',
                boxShadow: '-4px -4px 8px rgba(255,250,244,0.82), 4px 4px 10px rgba(160,143,126,0.28)',
                borderRadius: '0 14px 14px 14px',
                padding: '10px 16px',
                maxWidth: 400,
              }}>
                <p style={{ fontSize: 13, color: '#3a3a3a', lineHeight: 1.5 }}>Tell me about your goal. What do you want to achieve? I'll ask a few questions before creating a plan.</p>
              </div>
            </div>

            <div className="neu-raised" style={{ padding: '22px 24px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#3a3a3a', letterSpacing: '0.04em', marginBottom: 20 }}>Goal Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <FieldLabel>Goal Title</FieldLabel>
                  <NeuInput
                    placeholder="e.g., Launch new landing page by end of month"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Description (optional)</FieldLabel>
                  <NeuTextarea
                    placeholder="Add more context about what success looks like..."
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    style={{ height: 88 }}
                  />
                </div>
                <div>
                  <FieldLabel>Target Date</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button style={{
                        ...neuInset,
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 14px', cursor: 'pointer', textAlign: 'left',
                        color: targetDate ? '#3a3a3a' : '#9a9a9a',
                      }}>
                        <CalendarIcon style={{ width: 14, height: 14, strokeWidth: 1.5, flexShrink: 0 }} />
                        {targetDate ? format(targetDate, "PPP") : "Pick a deadline"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <NeuBtn onClick={onCancel}>Cancel</NeuBtn>
                <NeuBtn dark onClick={generateQuestions} disabled={!goalTitle || loading}>
                  {loading ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 0.8s linear infinite' }} /> : <Sparkles style={{ width: 13, height: 13 }} />}
                  Continue
                </NeuBtn>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Clarifying questions ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-start gap-3 mb-6">
              <AiAvatar />
              <div style={{
                background: '#eeeae6',
                boxShadow: '-4px -4px 8px rgba(255,250,244,0.82), 4px 4px 10px rgba(160,143,126,0.28)',
                borderRadius: '0 14px 14px 14px',
                padding: '10px 16px',
                maxWidth: 400,
              }}>
                <p style={{ fontSize: 13, color: '#3a3a3a', lineHeight: 1.5 }}>Great! Before I break this into tasks, I have a few questions:</p>
              </div>
            </div>

            <div className="neu-raised" style={{ padding: '22px 24px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#3a3a3a', letterSpacing: '0.04em', marginBottom: 20 }}>Clarifying Questions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {questions.map((q, i) => (
                  <div key={i}>
                    <FieldLabel>{q}</FieldLabel>
                    <NeuTextarea
                      placeholder="Your answer..."
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ height: 72 }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <NeuBtn onClick={() => setStep(0)}>
                  <ArrowLeft style={{ width: 13, height: 13 }} /> Back
                </NeuBtn>
                <NeuBtn dark onClick={generateTasks} disabled={loading}>
                  {loading ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 0.8s linear infinite' }} /> : <Sparkles style={{ width: 13, height: 13 }} />}
                  Generate Tasks
                </NeuBtn>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Review tasks ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-start gap-3 mb-6">
              <AiAvatar />
              <div style={{
                background: '#eeeae6',
                boxShadow: '-4px -4px 8px rgba(255,250,244,0.82), 4px 4px 10px rgba(160,143,126,0.28)',
                borderRadius: '0 14px 14px 14px',
                padding: '10px 16px',
                maxWidth: 400,
              }}>
                <p style={{ fontSize: 13, color: '#3a3a3a', lineHeight: 1.5 }}>Here's my proposed task breakdown. Review and edit anything, then approve to make it live.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {proposedTasks.map((task, i) => (
                <div key={i} className="neu-raised" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FieldLabel>Task Title</FieldLabel>
                      <NeuInput value={task.title} onChange={(e) => updateTask(i, "title", e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FieldLabel>Description</FieldLabel>
                      <NeuTextarea value={task.description} onChange={(e) => updateTask(i, "description", e.target.value)} style={{ height: 60 }} />
                    </div>
                    <div>
                      <FieldLabel>Assignee</FieldLabel>
                      <div style={{
                        ...neuInset,
                        padding: '9px 14px',
                        color: '#3a3a3a',
                        display: 'flex', alignItems: 'center',
                      }}>
                        {task.assignee_name || '—'}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Deadline</FieldLabel>
                      <NeuInput type="date" value={task.deadline} onChange={(e) => updateTask(i, "deadline", e.target.value)} />
                    </div>
                    <div>
                      <FieldLabel>Est. Hours</FieldLabel>
                      <NeuInput type="number" value={task.estimated_hours} onChange={(e) => updateTask(i, "estimated_hours", parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <NeuBtn onClick={() => setStep(1)}>
                <ArrowLeft style={{ width: 13, height: 13 }} /> Back
              </NeuBtn>
              <NeuBtn dark onClick={approveAndCreate} disabled={loading}>
                {loading ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 0.8s linear infinite' }} /> : <ArrowRight style={{ width: 13, height: 13 }} />}
                Approve & Create Tasks
              </NeuBtn>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}