import React, { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const FieldLabel = ({ children, hint }) => (
  <div style={{ marginBottom: 8 }}>
    <p style={{ fontSize: 12, fontWeight: 600, color: '#6e6e6e', letterSpacing: '0.04em', marginBottom: hint ? 2 : 0 }}>{children}</p>
    {hint && <p style={{ fontSize: 11, color: '#9a9a9a' }}>{hint}</p>}
  </div>
);

const NeuInput = ({ style, ...props }) => (
  <input
    {...props}
    style={{
      width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none', outline: 'none',
      background: '#ebe7e2',
      boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.22)',
      fontSize: 13, color: '#3a3a3a', boxSizing: 'border-box',
      ...style,
    }}
  />
);

const neuSelectStyle = {
  background: '#ebe7e2', border: 'none', borderRadius: 10,
  boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.22)',
  fontSize: 13, color: '#3a3a3a',
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return { value: `${h}:00`, label: `${h}:00` };
});

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    ping_frequency: "daily",
    working_hours_start: "09:00",
    working_hours_end: "17:00",
    ai_tone: "friendly",
  });
  const [workspaceName, setWorkspaceName] = useState("");

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => localClient.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setSettings(user.settings || {
        ping_frequency: "daily",
        working_hours_start: "09:00",
        working_hours_end: "17:00",
        ai_tone: "friendly",
      });
      setWorkspaceName(user.workspace_name || "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await localClient.auth.updateMe({ settings, workspace_name: workspaceName });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
    setSaving(false);
  };

  return (
    <div className="page-container" style={{ padding: '24px 28px', boxSizing: 'border-box', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: '#3a3a3a', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: '#6e6e6e' }}>Configure your AI assistant and workspace</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>

        {/* Left column: Workspace + Working Hours stacked flush */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Workspace — rounded top only */}
          <div className="neu-raised" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3a3a3a', letterSpacing: '0.04em', marginBottom: 18 }}>Workspace</p>
            <FieldLabel>Workspace Name</FieldLabel>
            <NeuInput
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="My Team"
            />
          </div>

          {/* Working Hours — rounded bottom only */}
          <div className="neu-raised" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3a3a3a', letterSpacing: '0.04em', marginBottom: 18 }}>Working Hours</p>
            <FieldLabel hint="AI will only send pings during these hours">Active Window</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#9a9a9a', marginBottom: 6 }}>Start</p>
                <Select value={settings.working_hours_start} onValueChange={(v) => setSettings({ ...settings, working_hours_start: v })}>
                  <SelectTrigger style={neuSelectStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#9a9a9a', marginBottom: 6 }}>End</p>
                <Select value={settings.working_hours_end} onValueChange={(v) => setSettings({ ...settings, working_hours_end: v })}>
                  <SelectTrigger style={neuSelectStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: AI Assistant */}
        <div className="neu-raised" style={{ padding: '22px 24px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#3a3a3a', letterSpacing: '0.04em', marginBottom: 18 }}>AI Assistant</p>
          <div style={{ marginBottom: 18 }}>
            <FieldLabel hint="How often the AI checks in with team members">Ping Frequency</FieldLabel>
            <Select value={settings.ping_frequency} onValueChange={(v) => setSettings({ ...settings, ping_frequency: v })}>
              <SelectTrigger style={neuSelectStyle}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Once daily</SelectItem>
                <SelectItem value="twice_daily">Twice daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>AI Tone</FieldLabel>
            <Select value={settings.ai_tone} onValueChange={(v) => setSettings({ ...settings, ai_tone: v })}>
              <SelectTrigger style={neuSelectStyle}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Friendly & casual</SelectItem>
                <SelectItem value="direct">Direct & concise</SelectItem>
                <SelectItem value="formal">Formal & professional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-neu flex items-center gap-2"
        style={{
          marginTop: 20,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '11px 20px', color: '#3a3a3a',
          opacity: saving ? 0.6 : 1,
          cursor: saving ? 'default' : 'pointer',
        }}
      >
        {saving
          ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />
          : <Save style={{ width: 14, height: 14 }} />}
        Save Settings
      </button>
    </div>
  );
}