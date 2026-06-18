// Command dispatcher. Maps the first CLI argument to a command module.

import { helpCommand } from "./commands/help.js";
import { serveCommand } from "./commands/serve.js";
import { chatCommand } from "./commands/chat.js";
import { askCommand } from "./commands/ask.js";
import { journalCommand } from "./commands/journal.js";
import { expenseCommand } from "./commands/expense.js";
import { ragCommand } from "./commands/rag.js";
import { planCommand } from "./commands/plan.js";
import { statusCommand } from "./commands/status.js";
import { versionCommand } from "./commands/version.js";
import { profileCommand } from "./commands/profile.js";
import { doctorCommand } from "./commands/doctor.js";
import { configCommand } from "./commands/config.js";
import { modelsCommand } from "./commands/models.js";
import { pluginsListCommand, pluginsRunCommand } from "./commands/plugins.js";
import { redactCommand } from "./commands/redact.js";
import { summaryCommand } from "./commands/summary.js";
import { tagsCommand } from "./commands/tags.js";
import { evalCommand } from "./commands/eval.js";
import { benchCommand } from "./commands/bench.js";
import { snapshotCommand } from "./commands/snapshot.js";
import { companionCommand } from "./commands/companion.js";
import { profilesCommand } from "./commands/profiles.js";
import { sensorsCommand } from "./commands/sensors.js";
import { multimodalCommand } from "./commands/multimodal.js";
import { exportCommand } from "./commands/export.js";
import { importCommand } from "./commands/import.js";
import { vectorCommand } from "./commands/vector.js";
import { hybridCommand } from "./commands/hybrid.js";
import { metricsCommand } from "./commands/metrics.js";
import { agentsCommand } from "./commands/agents.js";
import { tagsAddCommand } from "./commands/tags-add.js";
import { profileResetCommand } from "./commands/profile-reset.js";
import { tagStatsCommand } from "./commands/tag-stats.js";
import { journalStatsCommand } from "./commands/journal-stats.js";
import { expensesStatsCommand } from "./commands/expenses-stats.js";
import { whereCommand } from "./commands/where.js";
import { tailCommand } from "./commands/tail.js";
import { grepCommand } from "./commands/grep.js";
import { todayCommand } from "./commands/today.js";
import { yesterdayCommand } from "./commands/yesterday.js";
import { ciCommand } from "./commands/ci.js";
import { selfTestCommand } from "./commands/self-test.js";
import { demoDataCommand } from "./commands/demo-data.js";
import { wordCountCommand } from "./commands/word-count.js";
import { lintCommand } from "./commands/lint.js";
import { tokenCommand } from "./commands/token.js";
import { rotateSecretCommand } from "./commands/rotate-secret.js";
import { seedCommand } from "./commands/seed.js";
import { versionHistoryCommand } from "./commands/version-history.js";
import { versionCheckCommand } from "./commands/version-check.js";
import { versionBumpCommand } from "./commands/version-bump.js";
import { depsCommand } from "./commands/deps.js";
import { sizeCommand } from "./commands/size.js";
import { infoCommand } from "./commands/info.js";
import { releaseNotesCommand } from "./commands/release-notes.js";
import { releaseCommand } from "./commands/release.js";
import { retagCommand } from "./commands/retag.js";
import { weekSummaryCommand } from "./commands/week-summary.js";
import { monthSummaryCommand } from "./commands/month-summary.js";
import { watchCommand } from "./commands/watch.js";
import { compareCommand } from "./commands/compare.js";
import { commandListCommand } from "./commands/command-list.js";
import { showcaseCommand } from "./commands/showcase.js";
import { importCommand as _dupImport } from "./commands/import.js";
import { benchCompareCommand } from "./commands/bench-compare.js";
import { profileImportCommand } from "./commands/profile-import.js";
import { promptCommand } from "./commands/prompt.js";
import { goalsCommand } from "./commands/goals.js";
import { journalRagTopCommand } from "./commands/journal-rag-top.js";
import { journalRagCountCommand } from "./commands/journal-rag-count.js";
import { ragTopCommand } from "./commands/rag-top.js";
import { ragStatsCommand } from "./commands/rag-stats.js";
import { sampleJournalCommand } from "./commands/sample-journal.js";
import { sampleQuestionsCommand } from "./commands/sample-questions.js";
import { weeklyExportCommand } from "./commands/weekly-export.js";
import { monthlyExportCommand } from "./commands/monthly-export.js";
import { weeklyReviewCommand } from "./commands/weekly-review.js";
import { monthlyReviewCommand } from "./commands/monthly-review.js";
import { journalLongCommand } from "./commands/journal-long.js";
import { journalShortCommand } from "./commands/journal-short.js";
import { journalSummaryCommand } from "./commands/journal-summary.js";
import { expensesSummaryCommand } from "./commands/expenses-summary.js";
import { journalSummaryDetailedCommand } from "./commands/journal-summary-detailed.js";
import { expensesSummaryDetailedCommand } from "./commands/expenses-summary-detailed.js";
import { snapshotDiffCommand } from "./commands/snapshot-diff.js";
import { snapshotMergeCommand } from "./commands/snapshot-merge.js";
import { snapshotRedactCommand } from "./commands/snapshot-redact.js";
import { snapshotSignCommand } from "./commands/snapshot-sign.js";
import { snapshotVerifyCommand } from "./commands/snapshot-verify.js";
import { snapshotValidateCommand } from "./commands/snapshot-validate.js";
import { journalStripCommand } from "./commands/journal-strip.js";
import { journalRestoreCommand } from "./commands/journal-restore.js";
import { journalEmojiCommand } from "./commands/journal-emoji.js";
import { journalRmCommand } from "./commands/journal-rm.js";
import { tagNewCommand } from "./commands/tag-new.js";
import { tagRmCommand } from "./commands/tag-rm.js";
import { tagDeleteCommand } from "./commands/tag-delete.js";
import { tagRenameCommand } from "./commands/tag-rename.js";
import { tagListCommand } from "./commands/tag-list.js";
import { tagInfoCommand } from "./commands/tag-info.js";
import { tagRankCommand } from "./commands/tag-rank.js";
import { tagRecentCommand } from "./commands/tag-recent.js";
import { tagPercentCommand } from "./commands/tag-percent.js";
import { tagSearchCommand } from "./commands/tag-search.js";
import { tagPieCommand } from "./commands/tag-pie.js";
import { tagDensityCommand } from "./commands/tag-density.js";
import { tagDominantCommand } from "./commands/tag-dominant.js";
import { tagPairsCommand } from "./commands/tag-pairs.js";
import { tagTriosCommand } from "./commands/tag-trios.js";
import { tagRareCommand } from "./commands/tag-rare.js";
import { tagHistoryCommand } from "./commands/tag-history.js";
import { tagMostRecentCommand } from "./commands/tag-most-recent.js";
import { tagOrphansCommand } from "./commands/tag-orphans.js";
import { tagSuggestCommand } from "./commands/tag-suggest.js";
import { tagSuggestVocabCommand } from "./commands/tag-suggest-vocab.js";
import { tagSuggestExtendedCommand } from "./commands/tag-suggest-extended.js";
import { tagCloudCommand } from "./commands/tag-cloud.js";
import { tagCloudLargeCommand } from "./commands/tag-cloud-large.js";
import { tagCloudExtendedCommand } from "./commands/tag-cloud-extended.js";
import { tagCloudExtendedLargeCommand } from "./commands/tag-cloud-extended-large.js";
import { tagJaccardCommand } from "./commands/tag-jaccard.js";
import { tagJaccardAllCommand } from "./commands/tag-jaccard-all.js";
import { tagClusterCommand } from "./commands/tag-cluster.js";
import { tagStatsDetailedCommand } from "./commands/tag-stats-detailed.js";
import { tagStatsDetailedMonthlyCommand } from "./commands/tag-stats-detailed-monthly.js";
import { tagStatsMonthlyCommand } from "./commands/tag-stats-monthly.js";
import { tagStatsMonthlySummaryCommand } from "./commands/tag-stats-monthly-summary.js";
import { tagStatsMonthlyTrendCommand } from "./commands/tag-stats-monthly-trend.js";
import { tagStatsMonthlyDetailedCommand } from "./commands/tag-stats-monthly-detailed.js";
import { tagStatsQuarterlyCommand } from "./commands/tag-stats-quarterly.js";
import { tagStatsQuarterlyDetailedCommand } from "./commands/tag-stats-quarterly-detailed.js";
import { tagStatsYearlyCommand } from "./commands/tag-stats-yearly.js";
import { tagStatsYearlyDetailedCommand } from "./commands/tag-stats-yearly-detailed.js";
import { journalStatsQuickCommand } from "./commands/journal-stats-quick.js";
import { expensesStatsQuickByTagCommand } from "./commands/expenses-stats-quick-by-tag.js";
import { expensesStatsQuickByMonthCommand } from "./commands/expenses-stats-quick-by-month.js";
import { expensesStatsQuickByWeekdayCommand } from "./commands/expenses-stats-quick-by-weekday.js";
import { journalStatsQuickByMonthCommand } from "./commands/journal-stats-quick-by-month.js";
import { journalStatsQuickByWeekdayCommand } from "./commands/journal-stats-quick-by-weekday.js";
import { journalStatsQuickDetailedCommand } from "./commands/journal-stats-quick-detailed.js";
import { journalEntriesQuietDaysCommand } from "./commands/journal-entries-quiet-days.js";
import { journalEntriesMostRecentStreakCommand } from "./commands/journal-entries-most-recent-streak.js";
import { journalEntriesCurrentStreakCommand } from "./commands/journal-entries-current-streak.js";
import { journalEntriesLongestStreakCommand } from "./commands/journal-entries-longest-streak.js";
import { journalEntriesActiveDaysCommand } from "./commands/journal-entries-active-days.js";
import { expensesEntriesActiveDaysCommand } from "./commands/expenses-entries-active-days.js";
import { journalEntriesAveragePerDayCommand } from "./commands/journal-entries-average-per-day.js";
import { expensesEntriesAveragePerDayCommand } from "./commands/expenses-entries-average-per-day.js";
import { journalEntriesFirstLastCommand } from "./commands/journal-entries-first-last.js";
import { journalEntriesFirstCommand } from "./commands/journal-entries-first.js";
import { journalEntriesLastCommand } from "./commands/journal-entries-last.js";
import { expensesEntriesFirstLastCommand } from "./commands/expenses-entries-first-last.js";
import { expensesEntriesFirstCommand } from "./commands/expenses-entries-first.js";
import { expensesEntriesLastCommand } from "./commands/expenses-entries-last.js";
import { journalEntriesMidCommand } from "./commands/journal-entries-mid.js";
import { expensesEntriesMidCommand } from "./commands/expenses-entries-mid.js";
import { journalEntriesQuartileCommand } from "./commands/journal-entries-quartile.js";
import { expensesEntriesQuartileCommand } from "./commands/expenses-entries-quartile.js";
import { journalEntriesDecileCommand } from "./commands/journal-entries-decile.js";
import { expensesEntriesDecileCommand } from "./commands/expenses-entries-decile.js";
import { journalEntriesPercentileCommand } from "./commands/journal-entries-percentile.js";
import { expensesEntriesPercentileCommand } from "./commands/expenses-entries-percentile.js";
import { journalEntriesFirstNCommand } from "./commands/journal-entries-first-N.js";
import { journalEntriesLastNWeeksCommand } from "./commands/journal-entries-last-N-weeks.js";
import { journalEntriesLastNCommand } from "./commands/journal-entries-last-N.js";
import { expensesEntriesFirstNCommand } from "./commands/expenses-entries-first-N.js";
import { expensesEntriesLastNWeeksCommand } from "./commands/expenses-entries-last-N-weeks.js";
import { expensesEntriesLastNCommand } from "./commands/expenses-entries-last-N.js";
import { journalEntriesEveryNthCommand } from "./commands/journal-entries-every-Nth.js";
import { expensesEntriesEveryNthCommand } from "./commands/expenses-entries-every-Nth.js";
import { journalEntriesEveryOtherCommand } from "./commands/journal-entries-every-other.js";
import { expensesEntriesEveryOtherCommand } from "./commands/expenses-entries-every-other.js";
import { journalEntriesOddCommand } from "./commands/journal-entries-odd.js";
import { journalEntriesEvenCommand } from "./commands/journal-entries-even.js";
import { expensesEntriesOddCommand } from "./commands/expenses-entries-odd.js";
import { expensesEntriesEvenCommand } from "./commands/expenses-entries-even.js";
import { journalEntriesWeekendRangeCommand } from "./commands/journal-entries-weekend-range.js";
import { journalEntriesWeekendsCommand } from "./commands/journal-entries-weekends.js";
import { journalEntriesWeekdayRangeCommand } from "./commands/journal-entries-weekday-range.js";
import { journalEntriesWeekdaysCommand } from "./commands/journal-entries-weekdays.js";
import { expensesEntriesWeekendRangeCommand } from "./commands/expenses-entries-weekend-range.js";
import { expensesEntriesWeekendsCommand } from "./commands/expenses-entries-weekends.js";
import { expensesEntriesWeekdayRangeCommand } from "./commands/expenses-entries-weekday-range.js";
import { expensesEntriesWeekdaysCommand } from "./commands/expenses-entries-weekdays.js";
import { journalEntriesWeekdayNMonthCommand } from "./commands/journal-entries-weekday-N-month.js";
import { journalEntriesWeekdayNYearCommand } from "./commands/journal-entries-weekday-N-year.js";
import { journalEntriesWeekdayNCommand } from "./commands/journal-entries-weekday-N.js";
import { expensesEntriesWeekdayNMonthCommand } from "./commands/expenses-entries-weekday-N-month.js";
import { expensesEntriesWeekdayNYearCommand } from "./commands/expenses-entries-weekday-N-year.js";
import { expensesEntriesWeekdayNCommand } from "./commands/expenses-entries-weekday-N.js";
import { journalEntriesHourNCommand } from "./commands/journal-entries-hour-N.js";
import { expensesEntriesHourNCommand } from "./commands/expenses-entries-hour-N.js";
import { journalEntriesMonthNCommand } from "./commands/journal-entries-month-N.js";
import { expensesEntriesMonthNCommand } from "./commands/expenses-entries-month-N.js";

/**
 * Shape of the EdgeWell runtime object passed to every command.
 * Mirrors the return type of `createEdgeWell()` in src/index.ts.
 * Typed as a record-of-unknowns so commands can reach in for
 * whatever they need without us re-declaring every field here.
 * `createEdgeWell` is the source of truth for the actual shape.
 */
export type EdgeWellCtx = Record<string, unknown>;

/** Standard command function signature. */
export type CommandFn = (args: string[], ew: EdgeWellCtx) => Promise<unknown> | unknown;

// All commands are imported with implicit any (each is in a
// // @ts-nocheck file). Cast the whole map at the boundary so the
// dispatcher's type stays correct without us having to peel
// @ts-nocheck on 350+ files just to satisfy TS.
type RawFn = (...args: never[]) => unknown;
type RawMap = Record<string, RawFn>;

const MAP_RAW: RawMap = {
  help: helpCommand,
  serve: serveCommand,
  chat: chatCommand,
  ask: askCommand,
  journal: journalCommand,
  expense: expenseCommand,
  rag: ragCommand,
  plan: planCommand,
  status: statusCommand,
  version: versionCommand,
  profile: profileCommand,
  doctor: doctorCommand,
  config: configCommand,
  models: modelsCommand,
  redact: redactCommand,
  summary: summaryCommand,
  tags: tagsCommand,
  eval: evalCommand,
  bench: benchCommand,
  "bench-compare": benchCompareCommand,
  snapshot: snapshotCommand,
  companion: companionCommand,
  profiles: profilesCommand,
  sensors: sensorsCommand,
  multimodal: multimodalCommand,
  export: exportCommand,
  import: importCommand,
  vector: vectorCommand,
  hybrid: hybridCommand,
  metrics: metricsCommand,
  agents: agentsCommand,
  "tags-add": tagsAddCommand,
  "profile-reset": profileResetCommand,
  "profile-import": profileImportCommand,
  "tag-stats": tagStatsCommand,
  "journal-stats": journalStatsCommand,
  "expenses-stats": expensesStatsCommand,
  where: whereCommand,
  tail: tailCommand,
  grep: grepCommand,
  today: todayCommand,
  yesterday: yesterdayCommand,
  ci: ciCommand,
  "self-test": selfTestCommand,
  "demo-data": demoDataCommand,
  "word-count": wordCountCommand,
  lint: lintCommand,
  token: tokenCommand,
  "rotate-secret": rotateSecretCommand,
  seed: seedCommand,
  "version-history": versionHistoryCommand,
  "version-check": versionCheckCommand,
  "version-bump": versionBumpCommand,
  deps: depsCommand,
  size: sizeCommand,
  info: infoCommand,
  "release-notes": releaseNotesCommand,
  release: releaseCommand,
  retag: retagCommand,
  "week-summary": weekSummaryCommand,
  "month-summary": monthSummaryCommand,
  watch: watchCommand,
  compare: compareCommand,
  "command-list": commandListCommand,
  showcase: showcaseCommand,
  prompt: promptCommand,
  goals: goalsCommand,
  "journal-rag-top": journalRagTopCommand,
  "journal-rag-count": journalRagCountCommand,
  "rag-top": ragTopCommand,
  "rag-stats": ragStatsCommand,
  "sample-journal": sampleJournalCommand,
  "sample-questions": sampleQuestionsCommand,
  "weekly-export": weeklyExportCommand,
  "monthly-export": monthlyExportCommand,
  "weekly-review": weeklyReviewCommand,
  "monthly-review": monthlyReviewCommand,
  "journal-long": journalLongCommand,
  "journal-short": journalShortCommand,
  "journal-summary": journalSummaryCommand,
  "expenses-summary": expensesSummaryCommand,
  "journal-summary-detailed": journalSummaryDetailedCommand,
  "expenses-summary-detailed": expensesSummaryDetailedCommand,
  "snapshot-diff": snapshotDiffCommand,
  "snapshot-merge": snapshotMergeCommand,
  "snapshot-redact": snapshotRedactCommand,
  "snapshot-sign": snapshotSignCommand,
  "snapshot-verify": snapshotVerifyCommand,
  "snapshot-validate": snapshotValidateCommand,
  "journal-strip": journalStripCommand,
  "journal-restore": journalRestoreCommand,
  "journal-emoji": journalEmojiCommand,
  "journal-rm": journalRmCommand,
  "tag-new": tagNewCommand,
  "tag-rm": tagRmCommand,
  "tag-delete": tagDeleteCommand,
  "tag-rename": tagRenameCommand,
  "tag-list": tagListCommand,
  "tag-info": tagInfoCommand,
  "tag-rank": tagRankCommand,
  "tag-recent": tagRecentCommand,
  "tag-percent": tagPercentCommand,
  "tag-search": tagSearchCommand,
  "tag-pie": tagPieCommand,
  "tag-density": tagDensityCommand,
  "tag-dominant": tagDominantCommand,
  "tag-pairs": tagPairsCommand,
  "tag-trios": tagTriosCommand,
  "tag-rare": tagRareCommand,
  "tag-history": tagHistoryCommand,
  "tag-most-recent": tagMostRecentCommand,
  "tag-orphans": tagOrphansCommand,
  "tag-suggest": tagSuggestCommand,
  "tag-suggest-vocab": tagSuggestVocabCommand,
  "tag-suggest-extended": tagSuggestExtendedCommand,
  "tag-cloud": tagCloudCommand,
  "tag-cloud-large": tagCloudLargeCommand,
  "tag-cloud-extended": tagCloudExtendedCommand,
  "tag-cloud-extended-large": tagCloudExtendedLargeCommand,
  "tag-jaccard": tagJaccardCommand,
  "tag-jaccard-all": tagJaccardAllCommand,
  "tag-cluster": tagClusterCommand,
  "tag-stats-detailed": tagStatsDetailedCommand,
  "tag-stats-detailed-monthly": tagStatsDetailedMonthlyCommand,
  "tag-stats-monthly": tagStatsMonthlyCommand,
  "tag-stats-monthly-summary": tagStatsMonthlySummaryCommand,
  "tag-stats-monthly-trend": tagStatsMonthlyTrendCommand,
  "tag-stats-monthly-detailed": tagStatsMonthlyDetailedCommand,
  "tag-stats-quarterly": tagStatsQuarterlyCommand,
  "tag-stats-quarterly-detailed": tagStatsQuarterlyDetailedCommand,
  "tag-stats-yearly": tagStatsYearlyCommand,
  "tag-stats-yearly-detailed": tagStatsYearlyDetailedCommand,
  "journal-stats-quick": journalStatsQuickCommand,
  "expenses-stats-quick": expensesStatsQuickByTagCommand,
  "journal-stats-quick-by-month": journalStatsQuickByMonthCommand,
  "expenses-stats-quick-by-month": expensesStatsQuickByMonthCommand,
  "journal-stats-quick-by-weekday": journalStatsQuickByWeekdayCommand,
  "expenses-stats-quick-by-weekday": expensesStatsQuickByWeekdayCommand,
  "journal-stats-quick-detailed": journalStatsQuickDetailedCommand,
  "journal-entries-quiet-days": journalEntriesQuietDaysCommand,
  "journal-entries-most-recent-streak": journalEntriesMostRecentStreakCommand,
  "journal-entries-current-streak": journalEntriesCurrentStreakCommand,
  "journal-entries-longest-streak": journalEntriesLongestStreakCommand,
  "journal-entries-active-days": journalEntriesActiveDaysCommand,
  "expenses-entries-active-days": expensesEntriesActiveDaysCommand,
  "journal-entries-average-per-day": journalEntriesAveragePerDayCommand,
  "expenses-entries-average-per-day": expensesEntriesAveragePerDayCommand,
  "journal-entries-first-last": journalEntriesFirstLastCommand,
  "journal-entries-first": journalEntriesFirstCommand,
  "journal-entries-last": journalEntriesLastCommand,
  "expenses-entries-first-last": expensesEntriesFirstLastCommand,
  "expenses-entries-first": expensesEntriesFirstCommand,
  "expenses-entries-last": expensesEntriesLastCommand,
  "journal-entries-mid": journalEntriesMidCommand,
  "expenses-entries-mid": expensesEntriesMidCommand,
  "journal-entries-quartile": journalEntriesQuartileCommand,
  "expenses-entries-quartile": expensesEntriesQuartileCommand,
  "journal-entries-decile": journalEntriesDecileCommand,
  "expenses-entries-decile": expensesEntriesDecileCommand,
  "journal-entries-percentile": journalEntriesPercentileCommand,
  "expenses-entries-percentile": expensesEntriesPercentileCommand,
  "journal-entries-first-N": journalEntriesFirstNCommand,
  "journal-entries-last-N-weeks": journalEntriesLastNWeeksCommand,
  "journal-entries-last-N": journalEntriesLastNCommand,
  "expenses-entries-first-N": expensesEntriesFirstNCommand,
  "expenses-entries-last-N-weeks": expensesEntriesLastNWeeksCommand,
  "expenses-entries-last-N": expensesEntriesLastNCommand,
  "journal-entries-every-Nth": journalEntriesEveryNthCommand,
  "expenses-entries-every-Nth": expensesEntriesEveryNthCommand,
  "journal-entries-every-other": journalEntriesEveryOtherCommand,
  "expenses-entries-every-other": expensesEntriesEveryOtherCommand,
  "journal-entries-odd": journalEntriesOddCommand,
  "journal-entries-even": journalEntriesEvenCommand,
  "expenses-entries-odd": expensesEntriesOddCommand,
  "expenses-entries-even": expensesEntriesEvenCommand,
  "journal-entries-weekend-range": journalEntriesWeekendRangeCommand,
  "journal-entries-weekends": journalEntriesWeekendsCommand,
  "journal-entries-weekday-range": journalEntriesWeekdayRangeCommand,
  "journal-entries-weekdays": journalEntriesWeekdaysCommand,
  "expenses-entries-weekend-range": expensesEntriesWeekendRangeCommand,
  "expenses-entries-weekends": expensesEntriesWeekendsCommand,
  "expenses-entries-weekday-range": expensesEntriesWeekdayRangeCommand,
  "expenses-entries-weekdays": expensesEntriesWeekdaysCommand,
  "journal-entries-weekday-N-month": journalEntriesWeekdayNMonthCommand,
  "journal-entries-weekday-N-year": journalEntriesWeekdayNYearCommand,
  "journal-entries-weekday-N": journalEntriesWeekdayNCommand,
  "expenses-entries-weekday-N-month": expensesEntriesWeekdayNMonthCommand,
  "expenses-entries-weekday-N-year": expensesEntriesWeekdayNYearCommand,
  "expenses-entries-weekday-N": expensesEntriesWeekdayNCommand,
  "journal-entries-hour-N": journalEntriesHourNCommand,
  "expenses-entries-hour-N": expensesEntriesHourNCommand,
  "journal-entries-month-N": journalEntriesMonthNCommand,
  "expenses-entries-month-N": expensesEntriesMonthNCommand,
  plugins: (args: string[]): unknown => {
    if (args[0] === "list") return pluginsListCommand(args.slice(1) as never, undefined as never);
    if (args[0] === "run") return pluginsRunCommand(args.slice(1) as never, undefined as never);
    return pluginsListCommand([] as never, undefined as never);
  },
};

/** Typed view of the command registry. */
export const MAP: Record<string, CommandFn> = MAP_RAW as unknown as Record<string, CommandFn>;

/** Re-export under the v3.0.0 help-discovery name. */
export { MAP as COMMAND_MAP };

export async function dispatch(cmd: string, rest: string[], ew: EdgeWellCtx): Promise<unknown> {
  const fn = MAP[cmd];
  if (!fn) {
    if (cmd) {
      // Unknown command: print a one-line diagnostic, not the
      // 110-line help dump. Help is still available via
      // `edgewell help` or `edgewell command-list`.
      console.error(`unknown command: ${cmd}`);
      console.error("run `edgewell help` to see the full command list");
      process.exit(2);
    }
    await helpCommand();
    return undefined;
  }
  return fn(rest, ew);
}
