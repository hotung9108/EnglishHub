class UXEvaluator {
  constructor() {
    this.observations = [];
    this.critiques = {
      aesthetics: [],
      usability: [],
      missingFeatures: [],
      bugsAndDefects: []
    };
    this.scores = {
      guestAuth: { aesthetics: 0, usability: 0, completeness: 0 },
      student: { aesthetics: 0, usability: 0, completeness: 0 },
      teacher: { aesthetics: 0, usability: 0, completeness: 0 },
      admin: { aesthetics: 0, usability: 0, completeness: 0 },
      responsive: { aesthetics: 0, usability: 0, completeness: 0 }
    };
  }

  addAestheticCritique(title, assessment, recommendation, severity = 'Low') {
    this.critiques.aesthetics.push({ title, assessment, recommendation, severity });
  }

  addUsabilityCritique(heuristic, observation, impact, recommendation, severity = 'Medium') {
    this.critiques.usability.push({ heuristic, observation, impact, recommendation, severity });
  }

  addMissingFeature(module, featureName, userStory, benefit, priority = 'Medium') {
    this.critiques.missingFeatures.push({ module, featureName, userStory, benefit, priority });
  }

  addDefectObservation(code, srsRef, expectedCorrect, actualBug, severity = 'Major', screenshotRef = '') {
    this.critiques.bugsAndDefects.push({ code, srsRef, expectedCorrect, actualBug, severity, screenshotRef });
  }

  setRoleScore(role, { aesthetics, usability, completeness }) {
    if (this.scores[role]) {
      this.scores[role] = { aesthetics, usability, completeness };
    }
  }

  getReportData() {
    return {
      scores: this.scores,
      critiques: this.critiques
    };
  }
}

module.exports = new UXEvaluator();
