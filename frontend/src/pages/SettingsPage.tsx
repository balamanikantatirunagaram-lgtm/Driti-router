import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Key, ShieldCheck, Save, CheckCircle2, XCircle } from 'lucide-react';
import api from '../lib/api';
import { Settings } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export const SettingsPage = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [gatewayName, setGatewayName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const { toast } = useToast();

  const handleUpdateProfile = async () => {
    if (!newUsername.trim() && !newPassword.trim()) return;
    if (newPassword && !currentPassword) {
      toast({ title: 'Current password required', description: 'Please enter your current password to set a new one.', variant: 'destructive' });
      return;
    }
    setUpdatingProfile(true);
    try {
      const { data } = await api.put('/auth/update-profile', {
        username: newUsername.trim() || undefined,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined
      });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({ title: 'Credentials updated successfully ✓' });
      setCurrentPassword('');
      setNewPassword('');
      setNewUsername('');
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.response?.data?.detail || 'Could not update profile', variant: 'destructive' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/settings');
        setSettings(data);
        setGatewayName(data.gateway_name);
      } catch {
        toast({ title: 'Error fetching settings', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleValidateAndSave = async () => {
    if (!apiKey.trim()) return;
    setValidating(true);
    setValidationResult(null);
    try {
      const { data } = await api.post('/api/settings/validate-key', { api_key: apiKey });
      setValidationResult(data);
      if (data.valid) {
        setSavingKey(true);
        await api.post('/api/settings', { nvidia_api_key: apiKey });
        setSettings((s) => s ? { ...s, nvidia_connected: true, has_api_key: true } : null);
        toast({ title: 'API Key saved and validated ✓' });
        setApiKey('');
      } else {
        toast({ title: 'Invalid API Key', description: data.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Validation failed', variant: 'destructive' });
    } finally {
      setValidating(false);
      setSavingKey(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.post('/api/settings', { gateway_name: gatewayName });
      setSettings((s) => s ? { ...s, gateway_name: gatewayName } : null);
      toast({ title: 'Gateway configuration saved' });
    } catch {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-48 rounded-xl bg-card border border-border animate-pulse" />
        <div className="h-32 rounded-xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 max-w-3xl" variants={pageVariants} initial="initial" animate="animate">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your gateway and API connections.</p>
      </div>

      {/* NVIDIA API Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
              <Key className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <CardTitle>NVIDIA API Connection</CardTitle>
              <CardDescription className="mt-0.5">
                Your API key is encrypted with AES-256 (Fernet) before storage.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Current status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            {settings.nvidia_connected ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm">Connected to NVIDIA API</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {settings.has_api_key ? 'API key set but connection failed' : 'No API key configured'}
                </span>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>NVIDIA API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={settings.has_api_key ? '••••••••••••••••  (existing key)' : 'nvapi-...'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setValidationResult(null); }}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={handleValidateAndSave}
                disabled={validating || savingKey || !apiKey.trim()}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {validating ? 'Validating...' : savingKey ? 'Saving...' : 'Validate & Save'}
              </Button>
            </div>

            {validationResult && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs mt-1 ${validationResult.valid ? 'text-green-500' : 'text-red-500'}`}
              >
                {validationResult.message}
              </motion.p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gateway Config Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gateway Configuration</CardTitle>
          <CardDescription>General gateway settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label>Gateway Name</Label>
            <Input
              value={gatewayName}
              onChange={(e) => setGatewayName(e.target.value)}
              placeholder="Driti Gateway"
            />
          </div>
          <Button
            onClick={handleSaveConfig}
            disabled={savingConfig || gatewayName === settings.gateway_name || !gatewayName.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            {savingConfig ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Gateway Behavior Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gateway Behavior</CardTitle>
          <CardDescription>Advanced routing and performance configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Routing Mode</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="auto">Automatic (Recommended)</option>
                <option value="manual">Manual</option>
                <option value="cost">Cost Optimized</option>
                <option value="latency">Latency Optimized</option>
                <option value="reliability">Reliability Optimized</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Rate Limit (RPM)</Label>
              <Input type="number" defaultValue={600} />
            </div>
            <div className="space-y-2">
              <Label>Max Retries</Label>
              <Input type="number" defaultValue={3} />
            </div>
            <div className="space-y-2">
              <Label>Timeout (Seconds)</Label>
              <Input type="number" defaultValue={30} />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label className="text-sm">Streaming</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Enable SSE streaming</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label className="text-sm">Response Cache</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Cache identical requests</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label className="text-sm">Debug Mode</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Verbose logging</p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
            </div>
          </div>
          
          <div className="pt-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> Save Advanced Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Security Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Account Security & Login Credentials</CardTitle>
              <CardDescription>Update your admin username and password for logging into Driti Gateway.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-username">New Username (Optional)</Label>
              <Input
                id="new-username"
                placeholder="Leave blank to keep current"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password (Required for password change)</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-password">New Password (Optional)</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new admin password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="pt-2">
            <Button
              onClick={handleUpdateProfile}
              disabled={updatingProfile || (!newUsername.trim() && !newPassword.trim())}
              className="w-full sm:w-auto"
            >
              {updatingProfile ? 'Updating...' : 'Update Login Credentials'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

