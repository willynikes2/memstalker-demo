/**
 * Background service worker — initializes defaults and manages cross-tab state.
 * Privacy-first defaults per Codex + Gemini review feedback.
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    taste_warm: {},
    taste_long: {
      visualDensity: 'comfortable',
      layoutStyle: 'card',
      favoredContent: [],
      hiddenContent: [],
      colorScheme: 'dark',
      fontSize: 100,
      contrast: 100,
      siteRules: {},
      interactionPatterns: {},
      contentRankWeights: {
        recency: 0.3,
        engagement: 0.2,
        authorTrust: 0.2,
        topicMatch: 0.3
      }
    },
    trust_config: {
      globalLevel: 'view_only',
      siteOverrides: {},
      siteEnabled: {},
      dataCollection: false,
      memoryEnabled: false,
      onboarded: false
    }
  });
});
