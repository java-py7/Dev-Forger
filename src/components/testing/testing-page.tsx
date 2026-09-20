"use client";

import { useMemo, useState } from "react";
import {
  ProjectTestingData,
  TestRunItem,
  TestSuiteItem,
  runProjectTestsAction,
} from "@/app/(dashboard)/testing/testing-actions";
import { TestingHeader } from "./testing-header";
import { TestingOverview } from "./testing-overview";
import { TestFilters } from "./test-filters";
import { TestSuiteList } from "./test-suite-list";
import { TestRunList } from "./test-run-list";
import { TestDetailsDialog } from "./test-details-dialog";
import { TestingSetupDialog } from "./testing-setup-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, FlaskConical, HelpCircle, X } from "lucide-react";

type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  initialData: ProjectTestingData;
  userProjects: ProjectSummary[];
};

export function TestingPage({ initialData, userProjects }: Props) {
  const [data, setData] = useState<ProjectTestingData>(initialData);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [setupOpen, setSetupOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<TestRunItem | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<TestSuiteItem | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [suiteFilter, setSuiteFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Suite options for FilterSelect
  const suiteFilterOptions = useMemo(() => {
    return data.suites.map((s) => ({
      id: s.id,
      name: s.name,
    }));
  }, [data.suites]);

  // Filter & sort test runs
  const filteredRuns = useMemo(() => {
    let result = [...data.runs];

    if (statusFilter !== "ALL") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (sortOrder === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [data.runs, statusFilter, sortOrder]);

  // Filter test suites
  const filteredSuites = useMemo(() => {
    if (suiteFilter === "ALL") return data.suites;
    return data.suites.filter((s) => s.id === suiteFilter);
  }, [data.suites, suiteFilter]);

  const hasActiveFilters =
    statusFilter !== "ALL" || suiteFilter !== "ALL" || sortOrder !== "newest";

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setSuiteFilter("ALL");
    setSortOrder("newest");
  };

  const handleOpenSuite = (suite: TestSuiteItem) => {
    setSelectedSuite(suite);
    setSelectedRun(null);
    setDetailsOpen(true);
  };

  const handleOpenRun = (run: TestRunItem) => {
    setSelectedRun(run);
    setSelectedSuite(null);
    setDetailsOpen(true);
  };

  const handleRunTests = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!data.isConfigured && data.suites.length === 0) {
      setSetupOpen(true);
      return;
    }

    setIsRunning(true);
    try {
      const res = await runProjectTestsAction(data.project.id);

      if (!res.success) {
        if (res.notConfigured) {
          setSetupOpen(true);
        }
        setErrorMessage(res.error || "Failed to execute tests.");
        return;
      }

      if (res.run) {
        const newRun = res.run;
        setData((prev) => {
          const nextRuns = [newRun, ...prev.runs];
          return {
            ...prev,
            runs: nextRuns,
            stats: {
              ...prev.stats,
              totalTests: newRun.totalTests,
              passingTests: newRun.passedCount,
              failingTests: newRun.failedCount,
              pendingTests: newRun.pendingCount,
              lastRunAt: newRun.createdAt,
              overallStatus: newRun.status === "PASSED" ? "PASSED" : "FAILED",
            },
          };
        });

        if (newRun.status === "PASSED") {
          setSuccessMessage(
            `All tests passed successfully (${newRun.passedCount}/${newRun.totalTests}).`
          );
        } else {
          setErrorMessage(
            `Test execution failed: ${newRun.failedCount} test(s) failed.`
          );
        }
      }
    } catch {
      setErrorMessage("An unexpected network error occurred while running tests.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Header */}
      <TestingHeader
        currentProject={data.project}
        userProjects={userProjects}
        isConfigured={data.isConfigured}
        canEdit={data.canEdit}
        isRunning={isRunning}
        onRunTests={handleRunTests}
        onOpenSetup={() => setSetupOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Notification Banners */}
          {errorMessage && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="size-4 shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="shrink-0 cursor-pointer p-0.5 hover:opacity-70"
                aria-label="Dismiss message"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="truncate">{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="shrink-0 cursor-pointer p-0.5 hover:opacity-70"
                aria-label="Dismiss message"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Configuration Alert Banner if not configured */}
          {!data.isConfigured && data.suites.length === 0 && (
            <Card className="rounded-xl border border-muted bg-muted/20">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <FlaskConical className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Testing has not been configured yet
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                      No recognized test runner (Vitest, Jest, or Node Test Runner) or test suite files were found in{" "}
                      <span className="font-medium text-foreground">{data.project.name}</span>. Configure a test script to start running tests on DevForge.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSetupOpen(true)}
                    className="text-xs h-8 cursor-pointer gap-1.5"
                  >
                    <HelpCircle className="size-3.5" />
                    <span>View Setup Guide</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview Metrics */}
          <TestingOverview
            stats={data.stats}
            isConfigured={data.isConfigured}
            framework={data.framework}
          />

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <TestFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              suiteFilter={suiteFilter}
              onSuiteChange={setSuiteFilter}
              suiteOptions={suiteFilterOptions}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
            />

            <span className="text-xs text-muted-foreground">
              Showing {filteredRuns.length} of {data.runs.length} test {data.runs.length === 1 ? "run" : "runs"}
            </span>
          </div>

          {/* Test Suites & Runs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TestSuiteList
              suites={filteredSuites}
              projectSlug={data.project.slug}
              onSelectSuite={handleOpenSuite}
              onOpenSetup={() => setSetupOpen(true)}
            />

            <TestRunList
              runs={filteredRuns}
              onSelectRun={handleOpenRun}
              onRunTests={handleRunTests}
              isRunning={isRunning}
              canEdit={data.canEdit}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <TestingSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        projectSlug={data.project.slug}
      />

      <TestDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        run={selectedRun}
        suite={selectedSuite}
      />
    </div>
  );
}
