(() => {
  class EmitPuzzleChangeTool extends LiChessTools.Tools.ToolBase {

    processPuzzle = (records)=>{
      const lt = this.lichessTools;
      const $ = lt.$;
      const puzzleId = lt.getPuzzleId();
      if (puzzleId != this.puzzleId) {
        this.puzzleId = puzzleId;
        lt.pubsub.emit('lichessTools.puzzleStart', puzzleId);
      }
      if (records?.find(r=>r.addedNodes && Array.from(r.addedNodes).find(n=>$(n).is('.puzzle__feedback.after')))) {
        lt.pubsub.emit('lichessTools.puzzleEnd', puzzleId);
      }
      if (records?.find(r=>r.addedNodes && Array.from(r.addedNodes).find(n=>$(n).is('.puzzle__feedback.fail')))) {
        lt.pubsub.emit('lichessTools.puzzleFail', puzzleId);
      }
    };

    async start() {
      const lt = this.lichessTools;
      const $ = lt.$;
      const puzzleId = lt.getPuzzleId();
      if (!puzzleId) return;
      $('body')
        .observer()
        .on('.puzzle__tools',this.processPuzzle);
      lt.global.setTimeout(this.processPuzzle,100);
    }
  }
  LiChessTools.Tools.EmitPuzzleChange = EmitPuzzleChangeTool;
})();
