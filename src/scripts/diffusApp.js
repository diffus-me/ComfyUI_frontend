
export function getDiffusApp() {
    console.log("find diffusApp from parent window.", window.parent);
    if (!("diffusApp" in window.parent)) {
        throw "diffusApp not found in the parent window.";
    }
    console.log("diffusApp found in the parent window.", window.parent.diffusApp);
    return window.parent.diffusApp;
}

export function checkTierForPrompt(){
    const app = getDiffusApp();
    app.featurePermissions.checkTierForButton("ComfyUI");
    return true;
}

export function reportSpendCreditsEvent(credits){
    const app = getDiffusApp();
    app.analytics.reportSpendCreditsEvent("ComfyUI", credits);
}

export function openInsufficientDailyCreditsDialog(){
    const app = getDiffusApp();
    app.featurePermissions.openInsufficientDailyCreditsDialog();
}

export function openInsufficientCreditsDialog(){
    const app = getDiffusApp();
    app.featurePermissions.openInsufficientCreditsDialog();
}
