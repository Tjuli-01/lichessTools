(()=>{
  class PreferencesTool extends LiChessTools.Tools.ToolBase {

    intl={
      'en-US':{
        yes: 'Yes',
        no: 'No',
        'preferencesSaved': 'Your preferences have been saved',
        'rateThisText': 'Rate this!',
        'rateThisTitle': 'Ratings help me a lot',
        'blogLinkTitle': 'The page of the extension. Leave me a message.'
      },
      'ro-RO':{
        yes: 'Da',
        no: 'Nu',
        'preferencesSaved': 'Preferin\u0163ele tale au fost salvate',
        'rateThisText': 'D\u0103-i o not\u0103!',
        'rateThisTitle': 'Notele date m\u0103 ajut\u0103 foarte mult',
        'blogLinkTitle': 'Pagina extensiei. Trimite-mi un mesaj.'
      }
    }

  openPreferences=()=>{
    const $=this.lichessTools.$;
    const trans=this.lichessTools.translator;
    const tools=this.lichessTools.tools;
    const htmlEncode=this.lichessTools.htmlEncode;
    const currentOptions=this.lichessTools.currentOptions;
    const applyOptions=this.lichessTools.applyOptions;
    const lichess=this.lichessTools.lichess;
    const isOptionSet=this.lichessTools.isOptionSet;

    $('nav.page-menu__menu.subnav a.active').removeClass('active');
    $('a.lichessTools-menu').addClass('active');

    const showSaved= ()=> {
      $('.saved').removeClass('none');
      this.lichessTools.global.setTimeout(()=>$('.saved').addClass('none'),2000);
    }

    //TODO add link to translation project
    let html=`<div class="account box box-pad">
            <h1 class="box__top">$trans(LiChess Tools)</h1>
            <div class="links">
              <a class="rate" title="$trans(rateThisTitle)"
                 href="https://chrome.google.com/webstore/detail/lichess-tools-by-siderite/langlhlcknngldkeliapahbhbcmlcbcj" target="_blank">$trans(rateThisText)</a>
              <a class="blog" title="$trans(blogLinkTitle)"
                 href="https://siderite.dev/blog/new-chrome-extension-lichess-tools" target="_blank">siderite.dev</a>
            </div>
            <form>
            `;
        
    const categs={};
    for (const tool of tools) {
      if (!tool.preferences) continue;
      for (const pref of tool.preferences) {
        let categ=categs[pref.category];
        if (!categ) {
          categ=[];
          categs[pref.category]=categ;
        }
        categ.push(pref);
      }
    }

    for (const key in categs) {
      const categ=categs[key];
      html+='<div><h3>$trans(options.'+key+')</h3>';
      for (const pref of categ) {
        switch(pref.type) {
          case 'single': {
            html+=`<section><h2>$trans(options.${pref.name})</h2><group class="radio">`;
            for (const val of pref.possibleValues) {
              const textKey=typeof val==='boolean'
                ? (val?'yes':'no')
                : (pref.valuePrefix||pref.name+'.')+val;
              html+=`<div>
                  <input type="radio" value="${val}" name="${pref.name}"/>
                  <label>$trans(${textKey})</label>
                </div>`;
            }
            html+=`</group></section>`;
          }
          break;
          case 'multiple': {
            html+=`<section><h2>$trans(options.${pref.name})</h2><group class="radio">`;
            for (const val of pref.possibleValues) {
              const textKey=typeof val==='boolean'
                ? (val?'yes':'no')
                : (pref.valuePrefix||pref.name+'.')+val;
              html+=`<div>
                  <input type="checkbox" value="${val}" name="${pref.name}"/>
                  <label>$trans(${textKey})</label>
                </div>`;
            }
            html+=`</group></section>`;
          }
          break;
          case 'number': {
            html+=`<section><h2>$trans(options.${pref.name})</h2><group>
                <div>
                  <input class="form-control" type="number" name="${pref.name}"/>
                </div>
              </group></section>`;
          }
          break;
          default:
            throw new Error('Preference type '+pref.type+' not supported');
        }
      }
      html+=`</div>`;
    }

    html+=`</form><div>`;
    html=html.replace(/\$trans\(([^\)]+)\)/g,m=>{
      return htmlEncode(trans.noarg(m.slice(7,-1)));
    });

    const container=$('div.page-menu__content');
    let saved=$('p.saved',container);
    saved=saved.length?saved.clone():$('<p class="saved text none" data-icon="\ue038"></p>').text(trans.noarg('preferencesSaved'));
    container.empty()
      .append(html)
      .addClass('lichessTools-preferences');
    $('form',container).append(saved);
    $('input',container)
      .each((i,e)=>{
        const type=$(e).prop('type');
        const isCheckable=type=='radio'||type=='checkbox';
        const optionName=$(e).attr('name');
        const optionValue=$(e).attr('value');
        const currentValue=currentOptions[optionName];
        if (currentValue!==undefined) {
          if (isCheckable) {
            const checked = isOptionSet(currentValue,optionValue);
            $(e).prop('checked',checked);
          }
          else {
            $(e).val(currentValue);
          }
        }
        const label=$(e).next('label');
        if (label.length) {
          let id=$(e).attr('id');
          if (!id) {
            id = (Math.random() + 1).toString(36).substring(8);
            $(e).attr('id',id);
          }
          label.attr('for',id);
        }
      })
      .on('change keyup paste click',this.lichessTools.debounce(function() {
          const type=$(this).prop('type');
          const isCheckable=type=='radio'||type=='checkbox';
          const optionName=$(this).attr('name');
          const optionValues=isCheckable
		    ? $('input[name="'+optionName+'"]').filter((i,e)=>$(e).is(':checked')).map((i,e)=>$(e).attr('value')).get()
            : [$(this).val()];
          let value=optionValues.join(',');
          if (value==='true') value=true; 
          else if (value==='false') value=false;
          currentOptions[optionName]=value;
          applyOptions(currentOptions).then(function() {
            lichess.storage.fire('lichessTools.reloadOptions');
            showSaved();
          }).catch(e=>{ throw e; });
      },500));
    };


    async start() {
      const parent=this.lichessTools;
      const $=parent.$;
      const location=parent.global.location;
      const trans=parent.translator;
      if (!$('main.account').length) return;
      if ($('a.lichessTools-menu').length) return;
      const openPreferences=this.openPreferences;

      const f=function() {
        if (location.hash=='#lichessTools') {
          openPreferences();
        } else {
          if ($('.lichessTools-preferences').length) {
            location.reload();
          }
        }
      };
      f();
      $(parent.global).on('hashchange',f);

      const prefElem=$('<a>')
        .addClass('lichessTools-menu')
        .attr('href','/account/preferences/display#lichessTools')
	    .append($('<span>').text(trans.noarg('LiChess Tools')));

      $('nav.page-menu__menu.subnav a[href*=privacy]').before(prefElem);
    }

  }
  LiChessTools.Tools.Preferences=PreferencesTool;
})();
