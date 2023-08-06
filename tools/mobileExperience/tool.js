(()=>{
  class MobileExperienceTool extends LiChessTools.Tools.ToolBase {

    dependencies=['EmitRedraw','EmitChapterChange','RandomVariation'];

    preferences=[
      {
        name:'mobileExperience',
        category: 'general',
        type:'multiple',
        possibleValues: ['showGauge','hideOctopus','shapeDrawing','shapeDrawingRound','randomNextMove'],
        defaultValue: 'showGauge,randomNextMove'
      },
      {
        name:'colorCount',
        category: 'general',
        type:'single',
        possibleValues: [1,2,3,4],
        defaultValue: 4,
        advanced: true
      }
    ];

    intl={
      'en-US':{
        'options.analysis': 'General',
        'options.mobileExperience': 'Mobile device features',
        'options.colorCount': 'Colors for shapes on mobile',
        'mobileExperience.showGauge':'Evaluation gauge',
        'mobileExperience.hideOctopus':'Hide the octopus mascot',
        'mobileExperience.shapeDrawing':'Analysis arrows',
        'mobileExperience.shapeDrawingRound':'Game arrows',
        'mobileExperience.randomNextMove':'Random move button',
        'shapeDrawingTitle': 'LiChess Tools - draw arrows and circles',
        'randomNextMoveTitle': 'LiChess Tools - random move',
        'colorCount.1': 'one',
        'colorCount.2': 'two',
        'colorCount.3': 'three',
        'colorCount.4': 'four',
      },
      'ro-RO':{
        'options.analysis': 'General',                                                                     
        'options.mobileExperience': 'Op\u0163iuni pentru aparate mobile',
        'options.colorCount': 'Culori pentru s\u0103ge\u0163i pe mobile',
        'mobileExperience.showGauge':'Band\u0103 de evaluare',
        'mobileExperience.hideOctopus':'Ascunde mascota caracati\u0163\u0103',
        'mobileExperience.shapeDrawing':'S\u0103ge\u0163i \u00een analiz\u0103',
        'mobileExperience.shapeDrawingRound':'S\u0103ge\u0163i \u00een joc',
        'mobileExperience.randomNextMove':'Buton mutare aleatoare',
        'shapeDrawingTitle': 'LiChess Tools - deseneaz\u0103 s\u0103ge\u0163i \u015Fi cercuri',
        'randomNextMoveTitle': 'LiChess Tools - mutare aleatoare',
        'colorCount.1': 'unu',
        'colorCount.2': 'doi',
        'colorCount.3': 'trei',
        'colorCount.4': 'patru',
      }
    }

    touchStart=e=>{
      if (!this.drawingBrush || !this.chessground) return;
      e.preventDefault();
      e.stopPropagation();
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      const $=parent.$;
      const pos=[e.targetTouches[0].clientX,e.targetTouches[0].clientY];
      const square=this.chessground.getKeyAtDomPos(pos);
      this.chessground.state.drawable.current={
        orig: square,
        brush: this.drawingBrush,
        snapToValidMove: this.chessground.state.drawable.defaultSnapToValidMove,
        pos: pos
      };
      this.chessground.state.dom.redraw();
    };
    touchMove=e=>{
      if (!this.drawingBrush || !this.chessground) return;
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      const $=parent.$;
      if (!this.chessground.state.drawable.current) return;
      const pos=[e.targetTouches[0].clientX,e.targetTouches[0].clientY];
      const square=this.chessground.getKeyAtDomPos(pos);
      const current=this.chessground.state.drawable.current;
      current.pos=pos;
      current.mouseSq=square;
      current.dest=square;
      this.chessground.state.dom.redraw();
    };
    touchEnd=e=>{
      if (!this.drawingBrush || !this.chessground) return;
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      const $=parent.$;
      if (!this.chessground.state.drawable.current) return;
      e.preventDefault();
      e.stopPropagation();
      const pos=[e.changedTouches[0].clientX,e.changedTouches[0].clientY];
      const square=this.chessground.getKeyAtDomPos(pos);
      this.handleGesture(this.chessground.state.drawable.current);
      this.chessground.state.drawable.current=undefined;
      this.chessground.state.dom.redraw();
      lichess.pubsub.emit('shapeRank');
    };

    handleGesture=(shape)=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      const drawable=this.chessground.state.drawable;
      const existing=drawable.shapes.find(s=>s.orig===shape.orig && s.dest===shape.dest && s.brush===shape.brush);
      parent.arrayRemoveAll(drawable.shapes,s=>s.orig===shape.orig && s.dest===shape.dest);
      if (!existing) drawable.shapes.push(shape);
      if (drawable.onChange) drawable.onChange(drawable.shapes);
    };

    playRandomVariation=()=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      if (!lichess.analysis) return;
      const node = lichess.analysis.node;
      const child = parent.getRandomVariation(node);
      if (child) {
        lichess.analysis.userJump(child.path||(path+child.id));
        lichess.analysis.redraw();
      }
    };

    initializeOverlayWrap=()=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      const wrap=$('<div class="cg-wrap lichessTools-boardOverlay">')
        .appendTo('main.round div.main-board')
        .hide();
      const cg=Chessground(wrap[0],{
        fen: '8/8/8/8/8/8/8/8 w KQkq - 0 1',
        draggable: { 
          enabled: false
        },
        movable: {
          showDests: false
        },
        drawable: {
          enabled: false,
          defaultSnapToValidMove: lichess.storage.boolean('arrow.snap').getOrDefault(true)
        },
        disableContextMenu: true
      });
      wrap[0].chessground=cg;
      return wrap;
    };

    brushes=['green','red','blue','yellow'];
    toggleBrush=(ev)=>{
      let index=this.brushes.indexOf(this.drawingBrush)+1;
      this.drawingBrush=index>=this.options.colorCount
        ? null
        : this.brushes[index];
      const state=this.chessground.state;
      state.drawable.enabled=!this.drawingBrush;
      state.movable.showDests=!this.drawingBrush;
      state.draggable.enabled=!this.drawingBrush;
      for (const brush of this.brushes) {
        $(ev.target)
          .toggleClass('lichessTools-'+brush+'Brush',this.drawingBrush==brush);
      }
    };

    handleRedraw=()=>{
      const parent=this.lichessTools;
      const $=parent.$;
      if (!$('body').is('.mobile')) return;
      const trans=parent.translator;
      const isAnalyse=!!$('main.analyse').length;
      const isRound=!!$('main.round').length;
      $('body').toggleClass('lichessTools-mobileExperience',!!(this.options.shapeDrawing||this.options.shapeDrawingRound||this.options.randomNextMove));

      let wrap=null;
      this.chessground=null;
      if (isAnalyse) {
        $('main.analyse')
          .toggleClass('lichessTools-gaugeOnMobile',this.options.showGauge)
          .toggleClass('lichessTools-hideOctopus',this.options.hideOctopus);
        wrap=$('main.analyse div.cg-wrap');
        if (this.options.shapeDrawing) {
          this.chessground=parent.lichess.analysis.chessground;
        }
      };
      if (isRound) {
        wrap=$('main.round div.cg-wrap.lichessTools-boardOverlay');
        if (this.options.shapeDrawingRound) {
          if (!wrap.length) {
            wrap=this.initializeOverlayWrap();
          }
          this.chessground=wrap[0].chessground;
        }
      }
      if (this.options.shapeDrawing||this.options.shapeDrawingRound) {
        if (!wrap.is('.lichessTools-shapeDrawing')) {
          wrap
            .addClass('lichessTools-shapeDrawing')
            .on('touchstart',this.touchStart)
            .on('touchmove',this.touchMove)
            .on('touchend',this.touchEnd);
        }
      } else {
        wrap
          ?.removeClass('lichessTools-shapeDrawing')
          .off('touchstart',this.touchStart)
          .off('touchmove',this.touchMove)
          .off('touchend',this.touchEnd);
      }
      if (isAnalyse) {
        let addHandler=false;
        if (this.options.shapeDrawing) {
          if (!$('div.analyse__controls div.features button.lichessTools-shapeDrawing').length) {
            $('<button class="fbt">')
              .attr('data-icon','\u21D7')
              .attr('title',trans.noarg('shapeDrawingTitle'))
              .addClass('lichessTools-shapeDrawing')
              .appendTo('div.analyse__controls div.features');
            addHandler=true;
          }
        } else {
          $('div.analyse__controls div.features button.lichessTools-shapeDrawing').remove();
        }
        if (this.options.randomNextMove) {
          if (!$('div.analyse__controls div.jumps button.lichessTools-randomNextMove').length) {
            $('<button class="fbt">')
              .attr('data-icon','\uE035')
              .attr('title',trans.noarg('randomNextMoveTitle'))
              .addClass('lichessTools-randomNextMove')
              .insertBefore($('div.analyse__controls div.jumps button[data-act="next"]'));
            addHandler=true;
          }
        } else {
          $('div.analyse__controls div.jumps button.lichessTools-randomNextMove').remove();
        }
        if (addHandler) {
          const elem=$('.analyse__controls')[0];
          if (elem) {
            if (!this.originalHandler) {
              this.originalHandler=parent.getEventHandlers(elem,'touchstart')?.at(0)?.bind(elem);
            }
            parent.removeEventHandlers(elem,'touchstart');
            $('div.analyse__controls').on('touchstart',ev=>{
              this.originalHandler(ev);
              if ($(ev.target).is('button.lichessTools-shapeDrawing')) {
                ev.preventDefault();
                this.toggleBrush(ev);
              }
              if ($(ev.target).is('button.lichessTools-randomNextMove')) {
                ev.preventDefault();
                this.playRandomVariation();
              }
            });
          }
        }
        if (!this.options.shapeDrawing && !this.options.randomNextMove) {
          if (this.originalHandler) {
            const elem=$('.analyse__controls')[0];
            if (elem && this.originalHandler) {
              parent.removeEventHandlers(elem,'touchstart');
              $('div.analyse__controls').on('touchstart',this.originalHandler);
            }
          }
        }
      }
      if (isRound) {
        if (this.options.shapeDrawingRound) {
          const container=$('div.rcontrols div.ricons');
          if (!$('button.lichessTools-shapeDrawing',container).length) {
            $('<button class="fbt lichessTools-shapeDrawing">')
              .attr('data-icon','\u21D7')
              .attr('title',trans.noarg('shapeDrawingTitle'))
              .insertBefore($('button.board-menu-toggle',container))
              .on('touchstart',ev=>{
                this.toggleBrush(ev);
                wrap?.toggle(!!this.drawingBrush);
              });
          }
        } else {
          wrap?.remove();
          $('div.rcontrols div.ricons button.lichessTools-shapeDrawing').remove();
        }
      }
    };

    async start() {
      const parent=this.lichessTools;
      const value=parent.currentOptions.getValue('mobileExperience');
      this.logOption('Mobile experience', value);
      this.logOption('... color count', parent.currentOptions.getValue('colorCount'));
      this.options={
        showGauge:parent.isOptionSet(value,'showGauge'),
        hideOctopus:parent.isOptionSet(value,'hideOctopus'),
        shapeDrawing:parent.isOptionSet(value,'shapeDrawing'),
        shapeDrawingRound:parent.isOptionSet(value,'shapeDrawingRound'),
        randomNextMove:parent.isOptionSet(value,'randomNextMove'),
        colorCount: parent.currentOptions.getValue('colorCount')
      };
      const lichess=parent.lichess;
      lichess.pubsub.off('redraw',this.handleRedraw);
      lichess.pubsub.off('chapterChange',this.handleRedraw);
      if (this.options.showGauge || this.options.hideOctopus || this.options.shapeDrawing || this.options.shapeDrawingRound || this.options.randomNextMove) {
        lichess.pubsub.on('redraw',this.handleRedraw);
        lichess.pubsub.on('chapterChange',this.handleRedraw);
      }
      this.handleRedraw();
    }

  }
  LiChessTools.Tools.MobileExperience=MobileExperienceTool;
})();
