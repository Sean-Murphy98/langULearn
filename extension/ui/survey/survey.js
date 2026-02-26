const els = {
  yes: document.getElementById("answerYes"),
  no: document.getElementById("answerNo"),
  status: document.getElementById("status")
};

function setBusy(isBusy) {
  els.yes.disabled = isBusy;
  els.no.disabled = isBusy;
}

function sendResult(understood) {
  setBusy(true);
  els.status.textContent = "Saving response...";
  chrome.runtime.sendMessage({ type: "SURVEY_RESULT", understood }, (resp) => {
    if (resp && resp.ok) {
      els.status.textContent = `Saved. New percentage: ${resp.percent}%`;
      setTimeout(() => window.close(), 600);
    } else {
      els.status.textContent = "Could not save response.";
      setBusy(false);
    }
  });
}

els.yes.addEventListener("click", () => sendResult(true));
els.no.addEventListener("click", () => sendResult(false));
