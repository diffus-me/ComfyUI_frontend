
export function getDiffusApp() {
    if (!("diffusApp" in window.parent)) {
        throw "diffusApp not found in the parent window.";
    }
    return window.parent.diffusApp;
}

export function checkTierForPrompt(){
    const app = getDiffusApp();
    app.featurePermissions.checkTierForComfyUI();
    return true;
}

export function reportSpendCreditsEvent(credits){
    const app = getDiffusApp();
    app.analytics.reportSpendCreditsEvent("ComfyUI", credits);
}

export function openUpgradeDialogByReason(reason){
    const app = getDiffusApp();
    app.featurePermissions.openUpgradeDialogByReason(reason);
    return true;
}

export function showComfyUIBundleDialog(){
    const app = getDiffusApp();
    return app.featurePermissions.openComfyUIRewardBundleDialog();
}