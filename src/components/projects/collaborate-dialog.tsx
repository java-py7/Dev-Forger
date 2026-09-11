"use client";

import { useState } from "react";
import { Users, Check, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { applyToProject } from "@/app/(dashboard)/projects/actions";

type CollaborateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  ownerName: string;
  onSuccess?: () => void;
};

export function CollaborateDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  ownerName,
  onSuccess,
}: CollaborateDialogProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleApply() {
    setLoading(true);
    setError("");

    const res = await applyToProject({
      projectId,
      message,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to submit collaboration request.");
      return;
    }

    setSuccess(true);
    onSuccess?.();
    setTimeout(() => {
      setSuccess(false);
      setMessage("");
      onOpenChange(false);
    }, 1200);
  }

  function handleClose(value: boolean) {
    if (!loading) {
      setError("");
      setSuccess(false);
      onOpenChange(value);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
            <DialogTitle>Collaborate on Project</DialogTitle>
          </div>
          <DialogDescription>
            Send a request to collaborate on{" "}
            <span className="font-semibold text-foreground">{projectName}</span>{" "}
            hosted by {ownerName}.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check className="size-6" />
            </div>
            <h4 className="mt-3 font-semibold text-foreground">Request Sent!</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Your request to collaborate has been sent to the project owner.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collab-message">
                Why do you want to collaborate? (optional)
              </Label>
              <Textarea
                id="collab-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your skills, what you'd like to work on, or why you're interested in this project..."
                rows={4}
                maxLength={500}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={handleApply}
              >
                {loading ? "Sending..." : "Request to Join"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
