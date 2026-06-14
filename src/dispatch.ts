// @ts-nocheck
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
import { seedCommand } from "./commands/seed.js";
import { depsCommand } from "./commands/deps.js";
import { sizeCommand } from "./commands/size.js";
import { infoCommand } from "./commands/info.js";
import { tagCloudCommand } from "./commands/tag-cloud.js";
import { compareCommand } from "./commands/compare.js";
import { versionHistoryCommand } from "./commands/version-history.js";
import { dedupCommand } from "./commands/dedup.js";
import { watchCommand } from "./commands/watch.js";
import { diffCommand } from "./commands/diff.js";
import { rotateSecretCommand } from "./commands/rotate-secret.js";
import { snapshotRedactCommand } from "./commands/snapshot-redact.js";
import { scriptsCommand } from "./commands/scripts.js";
import { sampleJournalCommand } from "./commands/sample-journal.js";
import { sampleQuestionsCommand } from "./commands/sample-questions.js";
import { tagRenameCommand } from "./commands/tag-rename.js";
import { snippetCommand } from "./commands/snippet.js";
import { releaseNotesCommand } from "./commands/release-notes.js";
import { benchCompareCommand } from "./commands/bench-compare.js";
import { ciSummaryCommand } from "./commands/ci-summary.js";
import { lintFixCommand } from "./commands/lint-fix.js";
import { tagRmCommand } from "./commands/tag-rm.js";
import { journalFindCommand } from "./commands/journal-find.js";
import { lintSummaryCommand } from "./commands/lint-summary.js";
import { expensesFindCommand } from "./commands/expenses-find.js";
import { whereRagCommand } from "./commands/where-rag.js";
import { profileExportCommand } from "./commands/profile-export.js";
import { profileImportCommand } from "./commands/profile-import.js";
import { notesCommand } from "./commands/notes.js";
import { sleepStatsCommand } from "./commands/sleep-stats.js";
import { budgetCommand } from "./commands/budget.js";
import { savingsRateCommand } from "./commands/savings-rate.js";
import { trendCommand } from "./commands/trend.js";
import { promptCommand } from "./commands/prompt.js";
import { retagCommand } from "./commands/retag.js";
import { wordCountAdvancedCommand } from "./commands/word-count-advanced.js";
import { sleepTrendCommand } from "./commands/sleep-trend.js";
import { headlinesCommand } from "./commands/headlines.js";
import { expensesByDayCommand } from "./commands/expenses-by-day.js";
import { journalByTagCommand } from "./commands/journal-by-tag.js";
import { journalCountCommand } from "./commands/journal-count.js";
import { expensesCountCommand } from "./commands/expenses-count.js";
import { weeklyGoalsCommand } from "./commands/weekly-goals.js";
import { weeklyReviewCommand } from "./commands/weekly-review.js";
import { monthlyReviewCommand } from "./commands/monthly-review.js";
import { testSummaryCommand } from "./commands/test-summary.js";
import { journalStripCommand } from "./commands/journal-strip.js";
import { todoCommand } from "./commands/todo.js";
import { journalRmCommand } from "./commands/journal-rm.js";
import { journalRestoreCommand } from "./commands/journal-restore.js";
import { rot13Command } from "./commands/rot13.js";
import { agentListCommand } from "./commands/agent-list.js";
import { ragStatsCommand } from "./commands/rag-stats.js";
import { tagRankCommand } from "./commands/tag-rank.js";
import { journalDayCommand } from "./commands/journal-day.js";
import { expensesDayCommand } from "./commands/expenses-day.js";
import { holidayCommand } from "./commands/holiday.js";
import { medsCommand } from "./commands/meds.js";
import { contactsCommand } from "./commands/contacts.js";
import { goalsCommand } from "./commands/goals.js";
import { testsCommand } from "./commands/tests.js";
import { testCountCommand } from "./commands/test-count.js";
import { docsCommand } from "./commands/docs-index.js";
import { journalWeekCommand } from "./commands/journal-week.js";
import { expensesWeekCommand } from "./commands/expenses-week.js";
import { journalMonthCommand } from "./commands/journal-month.js";
import { expensesMonthCommand } from "./commands/expenses-month.js";
import { yamlCommand } from "./commands/yaml.js";
import { jsonCommand } from "./commands/json.js";
import { uptimeCommand } from "./commands/uptime.js";
import { nowCommand } from "./commands/now.js";
import { uuidCommand } from "./commands/uuid.js";
import { shaCommand } from "./commands/sha.js";
import { base64Command } from "./commands/base64.js";
import { countdownCommand } from "./commands/countdown.js";
import { jokeCommand } from "./commands/joke.js";
import { testListCommand } from "./commands/test-list.js";
import { commandListCommand } from "./commands/command-list.js";
import { snapshotDiffCommand } from "./commands/snapshot-diff.js";
import { snapshotMergeCommand } from "./commands/snapshot-merge.js";
import { snapshotValidateCommand } from "./commands/snapshot-validate.js";
import { snapshotSignCommand } from "./commands/snapshot-sign.js";
import { snapshotVerifyCommand } from "./commands/snapshot-verify.js";
import { versionCheckCommand } from "./commands/version-check.js";
import { versionBumpCommand } from "./commands/version-bump.js";
import { releaseCommand } from "./commands/release.js";
import { tagCommand } from "./commands/tag.js";
import { expenseAliasCommand } from "./commands/expense-alias.js";
import { weeklyExportCommand } from "./commands/weekly-export.js";
import { monthlyExportCommand } from "./commands/monthly-export.js";
import { tagDeleteCommand } from "./commands/tag-delete.js";
import { tagListCommand } from "./commands/tag-list.js";
import { tagHistoryCommand } from "./commands/tag-history.js";
import { monthSummaryCommand } from "./commands/month-summary.js";
import { weekSummaryCommand } from "./commands/week-summary.js";
import { tagSuggestCommand } from "./commands/tag-suggest.js";
import { journalSuggestCommand } from "./commands/journal-suggest.js";
import { tagPieCommand } from "./commands/tag-pie.js";
import { journalStatsExtendedCommand } from "./commands/journal-stats-extended.js";
import { expensesStatsExtendedCommand } from "./commands/expenses-stats-extended.js";
import { ragTopCommand } from "./commands/rag-top.js";
import { tagMostRecentCommand } from "./commands/tag-most-recent.js";
import { entryShowCommand } from "./commands/entry-show.js";
import { headCommand } from "./commands/head.js";
import { journalStatsDetailedCommand } from "./commands/journal-stats-detailed.js";
import { journalStatsQuickCommand } from "./commands/journal-stats-quick.js";
import { expensesFindMonthCommand } from "./commands/expenses-find-month.js";
import { journalFindMonthCommand } from "./commands/journal-find-month.js";
import { tagStatsDetailedCommand } from "./commands/tag-stats-detailed.js";
import { journalSummaryCommand } from "./commands/journal-summary.js";
import { expensesSummaryCommand } from "./commands/expenses-summary.js";
import { tagCooccurrenceCommand } from "./commands/tag-cooccurrence.js";
import { testCoverageCommand } from "./commands/test-coverage.js";
import { codeLinesCommand } from "./commands/code-lines.js";
import { tagStatsMonthlyCommand } from "./commands/tag-stats-monthly.js";
import { expensesByCategoryCommand } from "./commands/expenses-by-category.js";
import { tagTrendCommand } from "./commands/tag-trend.js";
import { categoryTrendCommand } from "./commands/category-trend.js";
import { journalMoodCommand } from "./commands/journal-mood.js";
import { journalMoodTrendCommand } from "./commands/journal-mood-trend.js";
import { journalEnergyTrendCommand } from "./commands/journal-energy-trend.js";
import { tagSuggestExtendedCommand } from "./commands/tag-suggest-extended.js";
import { journalTagsCommand } from "./commands/journal-tags.js";
import { tagOrphansCommand } from "./commands/tag-orphans.js";
import { tagDominantCommand } from "./commands/tag-dominant.js";
import { tagPercentCommand } from "./commands/tag-percent.js";
import { tagNewCommand } from "./commands/tag-new.js";
import { tagVocabularyCommand } from "./commands/tag-vocabulary.js";
import { journalMoodByTagCommand } from "./commands/journal-mood-by-tag.js";
import { tagPairsCommand } from "./commands/tag-pairs.js";
import { tagTriosCommand } from "./commands/tag-trios.js";
import { tagSearchCommand } from "./commands/tag-search.js";
import { tagSuggestVocabCommand } from "./commands/tag-suggest-vocab.js";
import { expensesMonthSummaryCommand } from "./commands/expenses-month-summary.js";
import { journalMonthSummaryCommand } from "./commands/journal-month-summary.js";
import { journalEmojiCommand } from "./commands/journal-emoji.js";
import { expensesStreakCommand } from "./commands/expenses-streak.js";
import { journalStreakCommand } from "./commands/journal-streak.js";
import { tagStatsSummaryCommand } from "./commands/tag-stats-summary.js";
import { expensesStatsSummaryCommand } from "./commands/expenses-stats-summary.js";
import { tagStatsMonthlyDetailedCommand } from "./commands/tag-stats-monthly-detailed.js";
import { expensesLargestCommand } from "./commands/expenses-largest.js";
import { expensesSmallestCommand } from "./commands/expenses-smallest.js";
import { tagStatsMonthlySummaryCommand } from "./commands/tag-stats-monthly-summary.js";
import { journalEmptyCommand } from "./commands/journal-empty.js";
import { expensesEmptyCommand } from "./commands/expenses-empty.js";
import { journalLongCommand } from "./commands/journal-long.js";
import { journalShortCommand } from "./commands/journal-short.js";
import { tagRecentCommand } from "./commands/tag-recent.js";
import { expensesRecentCommand } from "./commands/expenses-recent.js";
import { journalRecentCommand } from "./commands/journal-recent.js";
import { tagCloudLargeCommand } from "./commands/tag-cloud-large.js";
import { expensesCategoriesCommand } from "./commands/expenses-categories.js";
import { tagDensityCommand } from "./commands/tag-density.js";
import { journalStatsByMonthCommand } from "./commands/journal-stats-by-month.js";
import { expensesStatsByMonthCommand } from "./commands/expenses-stats-by-month.js";
import { tagInfoCommand } from "./commands/tag-info.js";
import { journalStatsWeekdayCommand } from "./commands/journal-stats-weekday.js";
import { expensesStatsWeekdayCommand } from "./commands/expenses-stats-weekday.js";
import { tagClusterCommand } from "./commands/tag-cluster.js";
import { tagJaccardCommand } from "./commands/tag-jaccard.js";
import { tagJaccardAllCommand } from "./commands/tag-jaccard-all.js";
import { tagCooccurrenceMatrixCommand } from "./commands/tag-cooccurrence-matrix.js";
import { journalRagTopCommand } from "./commands/journal-rag-top.js";
import { tagCooccurrenceSummaryCommand } from "./commands/tag-cooccurrence-summary.js";
import { tagStatsDetailedMonthlyCommand } from "./commands/tag-stats-detailed-monthly.js";
import { tagStatsMonthlyTrendCommand } from "./commands/tag-stats-monthly-trend.js";
import { journalStatsByTagCommand } from "./commands/journal-stats-by-tag.js";
import { expensesStatsByTagCommand } from "./commands/expenses-stats-by-tag.js";
import { journalBusiestDayCommand } from "./commands/journal-busiest-day.js";
import { expensesBusiestDayCommand } from "./commands/expenses-busiest-day.js";
import { journalBusiestWeekdayCommand } from "./commands/journal-busiest-weekday.js";
import { expensesBusiestWeekdayCommand } from "./commands/expenses-busiest-weekday.js";
import { journalRagCountCommand } from "./commands/journal-rag-count.js";
import { tagCooccurrenceMonthlyCommand } from "./commands/tag-cooccurrence-monthly.js";
import { journalStatsQuickDetailedCommand } from "./commands/journal-stats-quick-detailed.js";
import { journalEntriesTodayCommand } from "./commands/journal-entries-today.js";
import { expensesEntriesTodayCommand } from "./commands/expenses-entries-today.js";
import { tagRareCommand } from "./commands/tag-rare.js";
import { journalEntriesYesterdayCommand } from "./commands/journal-entries-yesterday.js";
import { expensesEntriesYesterdayCommand } from "./commands/expenses-entries-yesterday.js";
import { tagCooccurrenceBySourceCommand } from "./commands/tag-cooccurrence-by-source.js";
import { journalEntriesLastMonthCommand } from "./commands/journal-entries-last-month.js";
import { expensesEntriesLastMonthCommand } from "./commands/expenses-entries-last-month.js";
import { journalBusiestHourCommand } from "./commands/journal-busiest-hour.js";
import { expensesBusiestHourCommand } from "./commands/expenses-busiest-hour.js";
import { journalEntriesThisMonthCommand } from "./commands/journal-entries-this-month.js";
import { expensesEntriesThisMonthCommand } from "./commands/expenses-entries-this-month.js";
import { tagCloudExtendedCommand } from "./commands/tag-cloud-extended.js";
import { journalEntriesTodayCountCommand } from "./commands/journal-entries-today-count.js";
import { expensesEntriesTodayCountCommand } from "./commands/expenses-entries-today-count.js";
import { tagCloudExtendedLargeCommand } from "./commands/tag-cloud-extended-large.js";
import { journalMoodSummaryCommand } from "./commands/journal-mood-summary.js";
import { journalEntriesWeekCommand } from "./commands/journal-entries-week.js";
import { expensesEntriesWeekCommand } from "./commands/expenses-entries-week.js";
import { journalStatsByDayCommand } from "./commands/journal-stats-by-day.js";
import { expensesStatsByDayCommand } from "./commands/expenses-stats-by-day.js";
import { journalSummaryDetailedCommand } from "./commands/journal-summary-detailed.js";
import { expensesSummaryDetailedCommand } from "./commands/expenses-summary-detailed.js";
import { expensesEntriesDayOfMonthCommand } from "./commands/expenses-entries-day-of-month.js";
import { journalEntriesDayOfMonthCommand } from "./commands/journal-entries-day-of-month.js";
import { expensesEntriesLastWeekCommand } from "./commands/expenses-entries-last-week.js";
import { journalEntriesLastWeekCommand } from "./commands/journal-entries-last-week.js";
import { journalEntriesThisYearCommand } from "./commands/journal-entries-this-year.js";
import { expensesEntriesThisYearCommand } from "./commands/expenses-entries-this-year.js";
import { journalEntriesLastYearCommand } from "./commands/journal-entries-last-year.js";
import { expensesEntriesLastYearCommand } from "./commands/expenses-entries-last-year.js";
import { expensesEntriesThisWeekCommand } from "./commands/expenses-entries-this-week.js";
import { journalEntriesThisWeekCommand } from "./commands/journal-entries-this-week.js";
import { journalEntriesLast30DaysCommand } from "./commands/journal-entries-last-30-days.js";
import { expensesEntriesLast30DaysCommand } from "./commands/expenses-entries-last-30-days.js";
import { journalEntriesLast90DaysCommand } from "./commands/journal-entries-last-90-days.js";
import { expensesEntriesLast90DaysCommand } from "./commands/expenses-entries-last-90-days.js";
import { journalEntriesLast180DaysCommand } from "./commands/journal-entries-last-180-days.js";
import { expensesEntriesLast180DaysCommand } from "./commands/expenses-entries-last-180-days.js";
import { journalEntriesLast365DaysCommand } from "./commands/journal-entries-last-365-days.js";
import { expensesEntriesLast365DaysCommand } from "./commands/expenses-entries-last-365-days.js";
import { journalEntriesLastNDaysCommand } from "./commands/journal-entries-last-N-days.js";
import { expensesEntriesLastNDaysCommand } from "./commands/expenses-entries-last-N-days.js";
import { journalEntriesThisYearMonthCommand } from "./commands/journal-entries-this-year-month.js";
import { expensesEntriesThisYearMonthCommand } from "./commands/expenses-entries-this-year-month.js";
import { journalEntriesQuarterCommand } from "./commands/journal-entries-quarter.js";
import { expensesEntriesQuarterCommand } from "./commands/expenses-entries-quarter.js";
import { journalEntriesThisQuarterCommand } from "./commands/journal-entries-this-quarter.js";
import { expensesEntriesThisQuarterCommand } from "./commands/expenses-entries-this-quarter.js";
import { expensesEntriesLastQuarterCommand } from "./commands/expenses-entries-last-quarter.js";
import { journalEntriesLastQuarterCommand } from "./commands/journal-entries-last-quarter.js";
import { journalStatsQuickByTagCommand } from "./commands/journal-stats-quick-by-tag.js";
import { expensesStatsQuickByTagCommand } from "./commands/expenses-stats-quick-by-tag.js";
import { tagStatsQuarterlyCommand } from "./commands/tag-stats-quarterly.js";
import { tagStatsQuarterlyDetailedCommand } from "./commands/tag-stats-quarterly-detailed.js";
import { tagStatsYearlyCommand } from "./commands/tag-stats-yearly.js";
import { tagStatsYearlyDetailedCommand } from "./commands/tag-stats-yearly-detailed.js";
import { journalStatsQuickByMonthCommand } from "./commands/journal-stats-quick-by-month.js";
import { expensesStatsQuickByMonthCommand } from "./commands/expenses-stats-quick-by-month.js";
import { journalStatsQuickByWeekdayCommand } from "./commands/journal-stats-quick-by-weekday.js";
import { expensesStatsQuickByWeekdayCommand } from "./commands/expenses-stats-quick-by-weekday.js";
import { journalEntriesQuietDaysCommand } from "./commands/journal-entries-quiet-days.js";
import { journalEntriesMostRecentStreakCommand } from "./commands/journal-entries-most-recent-streak.js";
import { journalEntriesCurrentStreakCommand } from "./commands/journal-entries-current-streak.js";
import { journalEntriesLongestStreakCommand } from "./commands/journal-entries-longest-streak.js";
import { journalEntriesActiveDaysCommand } from "./commands/journal-entries-active-days.js";
import { expensesEntriesActiveDaysCommand } from "./commands/expenses-entries-active-days.js";
import { journalEntriesAveragePerDayCommand } from "./commands/journal-entries-average-per-day.js";
import { expensesEntriesAveragePerDayCommand } from "./commands/expenses-entries-average-per-day.js";
import { journalEntriesFirstCommand } from "./commands/journal-entries-first.js";
import { journalEntriesLastCommand } from "./commands/journal-entries-last.js";
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
import { journalEntriesLastNCommand } from "./commands/journal-entries-last-N.js";
import { expensesEntriesFirstNCommand } from "./commands/expenses-entries-first-N.js";
import { expensesEntriesLastNCommand } from "./commands/expenses-entries-last-N.js";
import { journalEntriesEveryNthCommand } from "./commands/journal-entries-every-Nth.js";
import { expensesEntriesEveryNthCommand } from "./commands/expenses-entries-every-Nth.js";
import { journalEntriesEveryOtherCommand } from "./commands/journal-entries-every-other.js";
import { expensesEntriesEveryOtherCommand } from "./commands/expenses-entries-every-other.js";
import { journalEntriesOddCommand } from "./commands/journal-entries-odd.js";
import { journalEntriesEvenCommand } from "./commands/journal-entries-even.js";
import { expensesEntriesOddCommand } from "./commands/expenses-entries-odd.js";
import { expensesEntriesEvenCommand } from "./commands/expenses-entries-even.js";
import { journalEntriesWeekendsCommand } from "./commands/journal-entries-weekends.js";
import { journalEntriesWeekdaysCommand } from "./commands/journal-entries-weekdays.js";
import { expensesEntriesWeekendsCommand } from "./commands/expenses-entries-weekends.js";
import { expensesEntriesWeekdaysCommand } from "./commands/expenses-entries-weekdays.js";
import { journalEntriesWeekdayNCommand } from "./commands/journal-entries-weekday-N.js";
import { expensesEntriesWeekdayNCommand } from "./commands/expenses-entries-weekday-N.js";
import { journalEntriesHourNCommand } from "./commands/journal-entries-hour-N.js";
import { expensesEntriesHourNCommand } from "./commands/expenses-entries-hour-N.js";
import { journalEntriesMonthNCommand } from "./commands/journal-entries-month-N.js";
import { expensesEntriesMonthNCommand } from "./commands/expenses-entries-month-N.js";
import { journalEntriesYearNCommand } from "./commands/journal-entries-year-N.js";
import { expensesEntriesYearNCommand } from "./commands/expenses-entries-year-N.js";
import { journalEntriesYearRangeCommand } from "./commands/journal-entries-year-range.js";
import { expensesEntriesYearRangeCommand } from "./commands/expenses-entries-year-range.js";
import { journalEntriesMonthRangeCommand } from "./commands/journal-entries-month-range.js";
import { expensesEntriesMonthRangeCommand } from "./commands/expenses-entries-month-range.js";
import { journalEntriesDayRangeCommand } from "./commands/journal-entries-day-range.js";
import { expensesEntriesDayRangeCommand } from "./commands/expenses-entries-day-range.js";
import { journalEntriesTodayRangeCommand } from "./commands/journal-entries-today-range.js";
import { expensesEntriesTodayRangeCommand } from "./commands/expenses-entries-today-range.js";
import { journalEntriesThisMonthRangeCommand } from "./commands/journal-entries-this-month-range.js";
import { expensesEntriesThisMonthRangeCommand } from "./commands/expenses-entries-this-month-range.js";
import { journalEntriesThisQuarterRangeCommand } from "./commands/journal-entries-this-quarter-range.js";
import { journalEntriesYearMonthCommand } from "./commands/journal-entries-year-month.js";
import { expensesEntriesYearMonthCommand } from "./commands/expenses-entries-year-month.js";
import { journalEntriesWeekNCommand } from "./commands/journal-entries-week-N.js";
import { journalEntriesDayOfWeekCommand } from "./commands/journal-entries-day-of-week.js";
import { expensesEntriesDayOfWeekCommand } from "./commands/expenses-entries-day-of-week.js";
import { journalEntriesMonthOfYearCommand } from "./commands/journal-entries-month-of-year.js";
import { expensesEntriesMonthOfYearCommand } from "./commands/expenses-entries-month-of-year.js";
import { journalEntriesDayOfMonthNCommand } from "./commands/journal-entries-day-of-month-N.js";
import { expensesEntriesDayOfMonthNCommand } from "./commands/expenses-entries-day-of-month-N.js";
import { journalEntriesDayOfYearCommand } from "./commands/journal-entries-day-of-year.js";
import { expensesEntriesDayOfYearCommand } from "./commands/expenses-entries-day-of-year.js";
import { expensesEntriesCountsByMonthOfYearCommand } from "./commands/expenses-entries-counts-by-month-of-year.js";
import { journalEntriesCountsByMonthOfYearCommand } from "./commands/journal-entries-counts-by-month-of-year.js";
import { expensesEntriesCountsByHourCommand } from "./commands/expenses-entries-counts-by-hour.js";
import { journalEntriesCountsByHourCommand } from "./commands/journal-entries-counts-by-hour.js";
import { expensesEntriesCountsByDayOfWeekCommand } from "./commands/expenses-entries-counts-by-day-of-week.js";
import { journalEntriesCountsByDayOfWeekCommand } from "./commands/journal-entries-counts-by-day-of-week.js";
import { expensesEntriesCountsByYearCommand } from "./commands/expenses-entries-counts-by-year.js";
import { journalEntriesCountsByYearCommand } from "./commands/journal-entries-counts-by-year.js";
import { expensesEntriesCountsByMonthCommand } from "./commands/expenses-entries-counts-by-month.js";
import { journalEntriesCountsByMonthCommand } from "./commands/journal-entries-counts-by-month.js";
import { expensesEntriesFirstLastCommand } from "./commands/expenses-entries-first-last.js";
import { journalEntriesFirstLastCommand } from "./commands/journal-entries-first-last.js";
import { expensesEntriesDuplicatesCommand } from "./commands/expenses-entries-duplicates.js";
import { journalEntriesDuplicatesCommand } from "./commands/journal-entries-duplicates.js";
import { expensesEntriesUniqueCommand } from "./commands/expenses-entries-unique.js";
import { journalEntriesUniqueCommand } from "./commands/journal-entries-unique.js";
import { expensesEntriesReversedCommand } from "./commands/expenses-entries-reversed.js";
import { journalEntriesReversedCommand } from "./commands/journal-entries-reversed.js";
import { expensesEntriesShuffledCommand } from "./commands/expenses-entries-shuffled.js";
import { journalEntriesShuffledCommand } from "./commands/journal-entries-shuffled.js";
import { expensesEntriesSortedCommand } from "./commands/expenses-entries-sorted.js";
import { journalEntriesSortedCommand } from "./commands/journal-entries-sorted.js";
import { journalEntriesCharsNotEqualCommand } from "./commands/journal-entries-chars-not-equal.js";
import { journalEntriesCharsEqualCommand } from "./commands/journal-entries-chars-equal.js";
import { journalEntriesWordsNotEqualCommand } from "./commands/journal-entries-words-not-equal.js";
import { journalEntriesWordsEqualCommand } from "./commands/journal-entries-words-equal.js";
import { journalEntriesWordsLesserCommand } from "./commands/journal-entries-words-lesser.js";
import { journalEntriesWordsGreaterCommand } from "./commands/journal-entries-words-greater.js";
import { journalEntriesShorterThanCommand } from "./commands/journal-entries-shorter-than.js";
import { journalEntriesLongerThanCommand } from "./commands/journal-entries-longer-than.js";
import { expensesEntriesExactCommand } from "./commands/expenses-entries-exact.js";
import { journalEntriesExactCommand } from "./commands/journal-entries-exact.js";
import { expensesEntriesRegexCommand } from "./commands/expenses-entries-regex.js";
import { journalEntriesRegexCommand } from "./commands/journal-entries-regex.js";
import { expensesEntriesEndsWithCommand } from "./commands/expenses-entries-ends-with.js";
import { journalEntriesEndsWithCommand } from "./commands/journal-entries-ends-with.js";
import { expensesEntriesStartsWithCommand } from "./commands/expenses-entries-starts-with.js";
import { journalEntriesStartsWithCommand } from "./commands/journal-entries-starts-with.js";
import { expensesEntriesContainsCommand } from "./commands/expenses-entries-contains.js";
import { journalEntriesContainsCommand } from "./commands/journal-entries-contains.js";
import { expensesEntriesWeekdayRangeCommand } from "./commands/expenses-entries-weekday-range.js";
import { journalEntriesWeekdayRangeCommand } from "./commands/journal-entries-weekday-range.js";
import { expensesEntriesWeekendRangeCommand } from "./commands/expenses-entries-weekend-range.js";
import { journalEntriesWeekendRangeCommand } from "./commands/journal-entries-weekend-range.js";
import { expensesEntriesWeekdayNYearCommand } from "./commands/expenses-entries-weekday-N-year.js";
import { journalEntriesWeekdayNYearCommand } from "./commands/journal-entries-weekday-N-year.js";
import { expensesEntriesWeekdayNMonthCommand } from "./commands/expenses-entries-weekday-N-month.js";
import { journalEntriesWeekdayNMonthCommand } from "./commands/journal-entries-weekday-N-month.js";
import { expensesEntriesMonthOfYearNCommand } from "./commands/expenses-entries-month-of-year-N.js";
import { journalEntriesMonthOfYearNCommand } from "./commands/journal-entries-month-of-year-N.js";
import { expensesEntriesDayOfYearNCommand } from "./commands/expenses-entries-day-of-year-N.js";
import { journalEntriesDayOfYearNCommand } from "./commands/journal-entries-day-of-year-N.js";
import { expensesEntriesDayOfWeekNCommand } from "./commands/expenses-entries-day-of-week-N.js";
import { journalEntriesDayOfWeekNCommand } from "./commands/journal-entries-day-of-week-N.js";
import { expensesEntriesQuarterNCommand } from "./commands/expenses-entries-quarter-N.js";
import { journalEntriesQuarterNCommand } from "./commands/journal-entries-quarter-N.js";
import { expensesEntriesThisQuarterNCommand } from "./commands/expenses-entries-this-quarter-N.js";
import { journalEntriesThisQuarterNCommand } from "./commands/journal-entries-this-quarter-N.js";
import { expensesEntriesThisWeekNCommand } from "./commands/expenses-entries-this-week-N.js";
import { journalEntriesThisWeekNCommand } from "./commands/journal-entries-this-week-N.js";
import { expensesEntriesLastNYearsCommand } from "./commands/expenses-entries-last-N-years.js";
import { journalEntriesLastNYearsCommand } from "./commands/journal-entries-last-N-years.js";
import { expensesEntriesLastNMonthsCommand } from "./commands/expenses-entries-last-N-months.js";
import { journalEntriesLastNMonthsCommand } from "./commands/journal-entries-last-N-months.js";
import { expensesEntriesLastNWeeksCommand } from "./commands/expenses-entries-last-N-weeks.js";
import { journalEntriesLastNWeeksCommand } from "./commands/journal-entries-last-N-weeks.js";
import { expensesEntriesYesterdayNCommand } from "./commands/expenses-entries-yesterday-N.js";
import { journalEntriesYesterdayNCommand } from "./commands/journal-entries-yesterday-N.js";
import { expensesEntriesTodayNCommand } from "./commands/expenses-entries-today-N.js";
import { journalEntriesTodayNCommand } from "./commands/journal-entries-today-N.js";
import { expensesEntriesHalfYearCommand } from "./commands/expenses-entries-half-year.js";
import { journalEntriesHalfYearCommand } from "./commands/journal-entries-half-year.js";
import { expensesEntriesQuarterOfYearCommand } from "./commands/expenses-entries-quarter-of-year.js";
import { journalEntriesQuarterOfYearCommand } from "./commands/journal-entries-quarter-of-year.js";
const __STRAGGLER_MAP = {
  "journal-entries-year-N": journalEntriesYearNCommand,
  "expenses-entries-year-month": expensesEntriesYearMonthCommand,
  "journal-entries-today-N": journalEntriesTodayNCommand,
  "journal-entries-today-range": journalEntriesTodayRangeCommand,
  "journal-entries-this-month-range": journalEntriesThisMonthRangeCommand,
  "journal-entries-this-quarter-range": journalEntriesThisQuarterRangeCommand,
  "journal-entries-year-month": journalEntriesYearMonthCommand,
  "journal-entries-week-N": journalEntriesWeekNCommand,
  "journal-entries-day-of-week-N": journalEntriesDayOfWeekNCommand,
  "journal-entries-day-of-week": journalEntriesDayOfWeekCommand,
  "expenses-entries-day-of-week-N": expensesEntriesDayOfWeekNCommand,
  "expenses-entries-day-of-week": expensesEntriesDayOfWeekCommand,
  "journal-entries-month-of-year-N": journalEntriesMonthOfYearNCommand,
  "journal-entries-month-of-year": journalEntriesMonthOfYearCommand,
  "expenses-entries-month-of-year-N": expensesEntriesMonthOfYearNCommand,
  "expenses-entries-month-of-year": expensesEntriesMonthOfYearCommand,
  "journal-entries-day-of-month-N": journalEntriesDayOfMonthNCommand,
  "expenses-entries-day-of-month-N": expensesEntriesDayOfMonthNCommand,
  "journal-entries-day-of-year-N": journalEntriesDayOfYearNCommand,
  "journal-entries-day-of-year": journalEntriesDayOfYearCommand,
  "expenses-entries-day-of-year-N": expensesEntriesDayOfYearNCommand,
  "expenses-entries-day-of-year": expensesEntriesDayOfYearCommand,
  "expenses-entries-half-year": expensesEntriesHalfYearCommand,
  "journal-entries-half-year": journalEntriesHalfYearCommand,
  "expenses-entries-quarter-of-year": expensesEntriesQuarterOfYearCommand,
  "journal-entries-quarter-of-year": journalEntriesQuarterOfYearCommand,
  "expenses-entries-today-N": expensesEntriesTodayNCommand,
  "expenses-entries-today-range": expensesEntriesTodayRangeCommand,
  "expenses-entries-this-month-range": expensesEntriesThisMonthRangeCommand,
  "expenses-entries-year-N": expensesEntriesYearNCommand,
  "journal-entries-year-range": journalEntriesYearRangeCommand,
  "expenses-entries-year-range": expensesEntriesYearRangeCommand,
  "journal-entries-month-range": journalEntriesMonthRangeCommand,
  "expenses-entries-month-range": expensesEntriesMonthRangeCommand,
  "journal-entries-day-range": journalEntriesDayRangeCommand,
  "expenses-entries-day-range": expensesEntriesDayRangeCommand,
};

const MAP = {
  ...__STRAGGLER_MAP,
  help: helpCommand,
  "--help": helpCommand,
  "-h": helpCommand,
  version: versionCommand,
  "--version": versionCommand,
  "-v": versionCommand,
  serve: serveCommand,
  chat: chatCommand,
  ask: askCommand,
  journal: journalCommand,
  expense: expenseCommand,
  rag: ragCommand,
  plan: planCommand,
  status: statusCommand,
  profile: profileCommand,
  doctor: doctorCommand,
  config: configCommand,
  models: modelsCommand,
  redact: redactCommand,
  summary: summaryCommand,
  tags: tagsCommand,
  eval: evalCommand,
  bench: benchCommand,
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
  seed: seedCommand,
  deps: depsCommand,
  size: sizeCommand,
  info: infoCommand,
  "tag-cloud": tagCloudCommand,
  compare: compareCommand,
  "version-history": versionHistoryCommand,
  dedup: dedupCommand,
  watch: watchCommand,
  diff: diffCommand,
  "rotate-secret": rotateSecretCommand,
  "snapshot-redact": snapshotRedactCommand,
  scripts: scriptsCommand,
  "sample-journal": sampleJournalCommand,
  "sample-questions": sampleQuestionsCommand,
  "tag-rename": tagRenameCommand,
  snippet: snippetCommand,
  "release-notes": releaseNotesCommand,
  "bench-compare": benchCompareCommand,
  "ci-summary": ciSummaryCommand,
  "lint-fix": lintFixCommand,
  "tag-rm": tagRmCommand,
  "journal-entries-words-lesser": journalEntriesWordsLesserCommand,
  "journal-entries-chars-not-equal": journalEntriesCharsNotEqualCommand,
  "journal-entries-chars-equal": journalEntriesCharsEqualCommand,
  "journal-entries-words-not-equal": journalEntriesWordsNotEqualCommand,
  "journal-entries-words-equal": journalEntriesWordsEqualCommand,
  "journal-entries-words-greater": journalEntriesWordsGreaterCommand,
  "journal-entries-shorter-than": journalEntriesShorterThanCommand,
  "journal-entries-longer-than": journalEntriesLongerThanCommand,
  "journal-entries-exact": journalEntriesExactCommand,
  "journal-entries-regex": journalEntriesRegexCommand,
  "journal-entries-ends-with": journalEntriesEndsWithCommand,
  "journal-entries-starts-with": journalEntriesStartsWithCommand,
  "journal-entries-contains": journalEntriesContainsCommand,
  "journal-find": journalFindCommand,
  "lint-summary": lintSummaryCommand,
  "expenses-entries-exact": expensesEntriesExactCommand,
  "expenses-entries-regex": expensesEntriesRegexCommand,
  "expenses-entries-ends-with": expensesEntriesEndsWithCommand,
  "expenses-entries-starts-with": expensesEntriesStartsWithCommand,
  "expenses-entries-contains": expensesEntriesContainsCommand,
  "expenses-find": expensesFindCommand,
  "where-rag": whereRagCommand,
  "profile-export": profileExportCommand,
  "profile-import": profileImportCommand,
  notes: notesCommand,
  "sleep-stats": sleepStatsCommand,
  budget: budgetCommand,
  "savings-rate": savingsRateCommand,
  trend: trendCommand,
  prompt: promptCommand,
  retag: retagCommand,
  "word-count-advanced": wordCountAdvancedCommand,
  "sleep-trend": sleepTrendCommand,
  headlines: headlinesCommand,
  "expenses-by-day": expensesByDayCommand,
  "journal-by-tag": journalByTagCommand,
  "journal-entries-counts-by-month-of-year": journalEntriesCountsByMonthOfYearCommand,
  "journal-entries-counts-by-hour": journalEntriesCountsByHourCommand,
  "journal-entries-counts-by-day-of-week": journalEntriesCountsByDayOfWeekCommand,
  "journal-entries-counts-by-year": journalEntriesCountsByYearCommand,
  "journal-entries-counts-by-month": journalEntriesCountsByMonthCommand,
  "journal-count": journalCountCommand,
  "expenses-entries-counts-by-month-of-year": expensesEntriesCountsByMonthOfYearCommand,
  "expenses-entries-counts-by-hour": expensesEntriesCountsByHourCommand,
  "expenses-entries-counts-by-day-of-week": expensesEntriesCountsByDayOfWeekCommand,
  "expenses-entries-counts-by-year": expensesEntriesCountsByYearCommand,
  "expenses-entries-counts-by-month": expensesEntriesCountsByMonthCommand,
  "expenses-count": expensesCountCommand,
  "weekly-goals": weeklyGoalsCommand,
  "weekly-review": weeklyReviewCommand,
  "monthly-review": monthlyReviewCommand,
  "test-summary": testSummaryCommand,
  "journal-strip": journalStripCommand,
  todo: todoCommand,
  "journal-rm": journalRmCommand,
  "journal-restore": journalRestoreCommand,
  rot13: rot13Command,
  "agent-list": agentListCommand,
  "rag-stats": ragStatsCommand,
  "tag-rank": tagRankCommand,
  "journal-day": journalDayCommand,
  "expenses-day": expensesDayCommand,
  holiday: holidayCommand,
  meds: medsCommand,
  contacts: contactsCommand,
  goals: goalsCommand,
  tests: testsCommand,
  "test-count": testCountCommand,
  docs: docsCommand,
  "journal-week": journalWeekCommand,
  "expenses-week": expensesWeekCommand,
  "journal-month": journalMonthCommand,
  "expenses-month": expensesMonthCommand,
  yaml: yamlCommand,
  json: jsonCommand,
  uptime: uptimeCommand,
  now: nowCommand,
  uuid: uuidCommand,
  sha: shaCommand,
  base64: base64Command,
  countdown: countdownCommand,
  joke: jokeCommand,
  "test-list": testListCommand,
  "command-list": commandListCommand,
  "snapshot-diff": snapshotDiffCommand,
  "snapshot-merge": snapshotMergeCommand,
  "snapshot-validate": snapshotValidateCommand,
  "snapshot-sign": snapshotSignCommand,
  "snapshot-verify": snapshotVerifyCommand,
  "version-check": versionCheckCommand,
  "version-bump": versionBumpCommand,
  release: releaseCommand,
  tag: tagCommand,
  "expense-alias": expenseAliasCommand,
  "weekly-export": weeklyExportCommand,
  "monthly-export": monthlyExportCommand,
  "tag-delete": tagDeleteCommand,
  "tag-list": tagListCommand,
  "tag-history": tagHistoryCommand,
  "month-summary": monthSummaryCommand,
  "week-summary": weekSummaryCommand,
  "tag-suggest": tagSuggestCommand,
  "journal-suggest": journalSuggestCommand,
  "tag-pie": tagPieCommand,
  "journal-stats-extended": journalStatsExtendedCommand,
  "expenses-stats-extended": expensesStatsExtendedCommand,
  "rag-top": ragTopCommand,
  "tag-most-recent": tagMostRecentCommand,
  "entry-show": entryShowCommand,
  head: headCommand,
  "journal-stats-detailed": journalStatsDetailedCommand,
  "journal-stats-quick": journalStatsQuickCommand,
  "expenses-find-month": expensesFindMonthCommand,
  "journal-find-month": journalFindMonthCommand,
  "tag-stats-detailed": tagStatsDetailedCommand,
  "journal-summary": journalSummaryCommand,
  "expenses-summary": expensesSummaryCommand,
  "tag-cooccurrence": tagCooccurrenceCommand,
  "test-coverage": testCoverageCommand,
  "code-lines": codeLinesCommand,
  "tag-stats-monthly": tagStatsMonthlyCommand,
  "expenses-by-category": expensesByCategoryCommand,
  "tag-trend": tagTrendCommand,
  "category-trend": categoryTrendCommand,
  "journal-mood": journalMoodCommand,
  "journal-mood-trend": journalMoodTrendCommand,
  "journal-energy-trend": journalEnergyTrendCommand,
  "tag-suggest-extended": tagSuggestExtendedCommand,
  "journal-tags": journalTagsCommand,
  "tag-orphans": tagOrphansCommand,
  "tag-dominant": tagDominantCommand,
  "tag-percent": tagPercentCommand,
  "tag-new": tagNewCommand,
  "tag-vocabulary": tagVocabularyCommand,
  "journal-mood-by-tag": journalMoodByTagCommand,
  "tag-pairs": tagPairsCommand,
  "tag-trios": tagTriosCommand,
  "tag-search": tagSearchCommand,
  "tag-suggest-vocab": tagSuggestVocabCommand,
  "expenses-month-summary": expensesMonthSummaryCommand,
  "journal-month-summary": journalMonthSummaryCommand,
  "journal-entries-duplicates": journalEntriesDuplicatesCommand,
  "journal-entries-unique": journalEntriesUniqueCommand,
  "journal-entries-reversed": journalEntriesReversedCommand,
  "journal-entries-shuffled": journalEntriesShuffledCommand,
  "journal-entries-sorted": journalEntriesSortedCommand,
  "journal-emoji": journalEmojiCommand,
  "expenses-streak": expensesStreakCommand,
  "journal-streak": journalStreakCommand,
  "tag-stats-summary": tagStatsSummaryCommand,
  "expenses-stats-summary": expensesStatsSummaryCommand,
  "tag-stats-monthly-detailed": tagStatsMonthlyDetailedCommand,
  "expenses-largest": expensesLargestCommand,
  "expenses-smallest": expensesSmallestCommand,
  "tag-stats-monthly-summary": tagStatsMonthlySummaryCommand,
  "journal-empty": journalEmptyCommand,
  "expenses-empty": expensesEmptyCommand,
  "journal-long": journalLongCommand,
  "journal-short": journalShortCommand,
  "tag-recent": tagRecentCommand,
  "expenses-entries-duplicates": expensesEntriesDuplicatesCommand,
  "expenses-entries-unique": expensesEntriesUniqueCommand,
  "expenses-entries-reversed": expensesEntriesReversedCommand,
  "expenses-entries-shuffled": expensesEntriesShuffledCommand,
  "expenses-entries-sorted": expensesEntriesSortedCommand,
  "expenses-recent": expensesRecentCommand,
  "journal-recent": journalRecentCommand,
  "tag-cloud-large": tagCloudLargeCommand,
  "expenses-categories": expensesCategoriesCommand,
  "tag-density": tagDensityCommand,
  "journal-stats-by-month": journalStatsByMonthCommand,
  "expenses-stats-by-month": expensesStatsByMonthCommand,
  "tag-info": tagInfoCommand,
  "journal-stats-weekday": journalStatsWeekdayCommand,
  "expenses-stats-weekday": expensesStatsWeekdayCommand,
  "tag-cluster": tagClusterCommand,
  "tag-jaccard": tagJaccardCommand,
  "tag-jaccard-all": tagJaccardAllCommand,
  "tag-cooccurrence-matrix": tagCooccurrenceMatrixCommand,
  "journal-rag-top": journalRagTopCommand,
  "tag-cooccurrence-summary": tagCooccurrenceSummaryCommand,
  "tag-stats-detailed-monthly": tagStatsDetailedMonthlyCommand,
  "tag-stats-monthly-trend": tagStatsMonthlyTrendCommand,
  "journal-stats-by-tag": journalStatsByTagCommand,
  "expenses-stats-by-tag": expensesStatsByTagCommand,
  "journal-busiest-day": journalBusiestDayCommand,
  "expenses-busiest-day": expensesBusiestDayCommand,
  "journal-busiest-weekday": journalBusiestWeekdayCommand,
  "expenses-busiest-weekday": expensesBusiestWeekdayCommand,
  "journal-rag-count": journalRagCountCommand,
  "tag-cooccurrence-monthly": tagCooccurrenceMonthlyCommand,
  "journal-stats-quick-detailed": journalStatsQuickDetailedCommand,
  "journal-entries-today": journalEntriesTodayCommand,
  "expenses-entries-today": expensesEntriesTodayCommand,
  "tag-rare": tagRareCommand,
  "journal-entries-yesterday-N": journalEntriesYesterdayNCommand,
  "journal-entries-yesterday": journalEntriesYesterdayCommand,
  "expenses-entries-yesterday-N": expensesEntriesYesterdayNCommand,
  "expenses-entries-yesterday": expensesEntriesYesterdayCommand,
  "tag-cooccurrence-by-source": tagCooccurrenceBySourceCommand,
  "journal-entries-last-N-months": journalEntriesLastNMonthsCommand,
  "journal-entries-last-month": journalEntriesLastMonthCommand,
  "expenses-entries-last-N-months": expensesEntriesLastNMonthsCommand,
  "expenses-entries-last-month": expensesEntriesLastMonthCommand,
  "journal-busiest-hour": journalBusiestHourCommand,
  "expenses-busiest-hour": expensesBusiestHourCommand,
  "journal-entries-this-month": journalEntriesThisMonthCommand,
  "expenses-entries-this-month": expensesEntriesThisMonthCommand,
  "tag-cloud-extended": tagCloudExtendedCommand,
  "journal-entries-today-count": journalEntriesTodayCountCommand,
  "expenses-entries-today-count": expensesEntriesTodayCountCommand,
  "tag-cloud-extended-large": tagCloudExtendedLargeCommand,
  "journal-mood-summary": journalMoodSummaryCommand,
  "journal-entries-week": journalEntriesWeekCommand,
  "expenses-entries-week": expensesEntriesWeekCommand,
  "journal-stats-by-day": journalStatsByDayCommand,
  "expenses-stats-by-day": expensesStatsByDayCommand,
  "journal-summary-detailed": journalSummaryDetailedCommand,
  "expenses-summary-detailed": expensesSummaryDetailedCommand,
  "expenses-entries-day-of-month": expensesEntriesDayOfMonthCommand,
  "journal-entries-day-of-month": journalEntriesDayOfMonthCommand,
  "expenses-entries-last-week": expensesEntriesLastWeekCommand,
  "journal-entries-last-week": journalEntriesLastWeekCommand,
  "journal-entries-this-year": journalEntriesThisYearCommand,
  "expenses-entries-this-year": expensesEntriesThisYearCommand,
  "journal-entries-last-N-years": journalEntriesLastNYearsCommand,
  "journal-entries-last-year": journalEntriesLastYearCommand,
  "expenses-entries-last-N-years": expensesEntriesLastNYearsCommand,
  "expenses-entries-last-year": expensesEntriesLastYearCommand,
  "expenses-entries-this-week-N": expensesEntriesThisWeekNCommand,
  "expenses-entries-this-week": expensesEntriesThisWeekCommand,
  "journal-entries-this-week-N": journalEntriesThisWeekNCommand,
  "journal-entries-this-week": journalEntriesThisWeekCommand,
  "journal-entries-last-30-days": journalEntriesLast30DaysCommand,
  "expenses-entries-last-30-days": expensesEntriesLast30DaysCommand,
  "journal-entries-last-90-days": journalEntriesLast90DaysCommand,
  "expenses-entries-last-90-days": expensesEntriesLast90DaysCommand,
  "journal-entries-last-180-days": journalEntriesLast180DaysCommand,
  "expenses-entries-last-180-days": expensesEntriesLast180DaysCommand,
  "journal-entries-last-365-days": journalEntriesLast365DaysCommand,
  "expenses-entries-last-365-days": expensesEntriesLast365DaysCommand,
  "journal-entries-last-N-days": journalEntriesLastNDaysCommand,
  "expenses-entries-last-N-days": expensesEntriesLastNDaysCommand,
  "journal-entries-this-year-month": journalEntriesThisYearMonthCommand,
  "expenses-entries-this-year-month": expensesEntriesThisYearMonthCommand,
  "journal-entries-quarter": journalEntriesQuarterCommand,
  "expenses-entries-quarter": expensesEntriesQuarterCommand,
  "journal-entries-quarter-N": journalEntriesQuarterNCommand,
  "journal-entries-this-quarter-N": journalEntriesThisQuarterNCommand,
  "journal-entries-this-quarter": journalEntriesThisQuarterCommand,
  "expenses-entries-quarter-N": expensesEntriesQuarterNCommand,
  "expenses-entries-this-quarter-N": expensesEntriesThisQuarterNCommand,
  "expenses-entries-this-quarter": expensesEntriesThisQuarterCommand,
  "expenses-entries-last-quarter": expensesEntriesLastQuarterCommand,
  "journal-entries-last-quarter": journalEntriesLastQuarterCommand,
  "journal-stats-quick-by-tag": journalStatsQuickByTagCommand,
  "expenses-stats-quick-by-tag": expensesStatsQuickByTagCommand,
  "tag-stats-quarterly": tagStatsQuarterlyCommand,
  "tag-stats-quarterly-detailed": tagStatsQuarterlyDetailedCommand,
  "tag-stats-yearly": tagStatsYearlyCommand,
  "tag-stats-yearly-detailed": tagStatsYearlyDetailedCommand,
  "journal-stats-quick-by-month": journalStatsQuickByMonthCommand,
  "expenses-stats-quick-by-month": expensesStatsQuickByMonthCommand,
  "journal-stats-quick-by-weekday": journalStatsQuickByWeekdayCommand,
  "expenses-stats-quick-by-weekday": expensesStatsQuickByWeekdayCommand,
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
  plugins: (args, ew) => {
    if (args[0] === "list") return pluginsListCommand(args.slice(1), ew);
    if (args[0] === "run") return pluginsRunCommand(args.slice(1), ew);
    return pluginsListCommand([], ew);
  },
};

export async function dispatch(cmd, rest, ew) {
  const fn = MAP[cmd];
  if (!fn) {
    await helpCommand();
    process.exit(cmd ? 2 : 0);
  }
  return fn(rest, ew);
}

export { MAP as COMMAND_MAP };
