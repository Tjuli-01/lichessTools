(()=>{
  class FriendsTvTool extends LiChessTools.Tools.ToolBase {

    preferences=[
      {
        name:'friendsTv',
        category: 'TV',
        type:'single',
        possibleValues: [false,true],
        defaultValue: true,
        advanced: true
      }
    ];

    intl={
      'en-US':{
        'options.TV': 'TV',
        'options.friendsTv': 'TV with the games of your friends',
        'friendsButtonTitle': 'LiChess Tools - games of your friends',
        'friends': 'Friends',
        'noGames': 'No available games'
      },
      'ro-RO':{
        'options.TV': 'TV',
        'options.friendsTv': 'TV cu jocurile prietenilor t\u0103i',
        'friendsButtonTitle': 'LiChess Tools - jocurile prietenilor t\u0103i',
        'friends': 'Prieteni',
        'noGames': 'Nu sunt jocuri disponibile'
      }
    }

    isGamesPage=()=>{
       return /^\/games(\/|$)?/i.test(this.lichessTools.global.location.pathname);
    };

    isFriendsTvPage=()=>{
       return /^\/games\/?$/i.test(this.lichessTools.global.location.pathname) && location.hash=='#friends';
    };

    updateFriendsTvButton=()=>{
      const parent=this.lichessTools;
      const value=parent.currentOptions.getValue('friendsTv');
      const $=parent.$;
      const trans=this.lichessTools.translator;

      if (!this.isGamesPage()) return;

      const container = $('main.tv-games div.tv-channels');
      if (!value) {
        $('a.lichessTools-friends',container).remove();
        return;
      }
      const elem=$('a.lichessTools-friends',container);
      if (this.isFriendsTvPage()) {
        parent.global.document.title=parent.global.document.title?.replace(/^.*?\u2022/,trans.noarg('friends')+' \u2022');

        $('a.active:not(.lichessTools-friends)',container).removeClass('active');
        parent.lichess.pubsub.emit=parent.unwrapFunction(parent.lichess.pubsub.emit,'friendsTv');
        parent.lichess.pubsub.emit=parent.wrapFunction(parent.lichess.pubsub.emit,{
          id:'friendsTv',
          before:($this,name,info)=>{
            if (name=='socket.in.finish') {
              const gameId=info.id;
              $('main.tv-games div.page-menu__content.now-playing a[data-live="'+gameId+'"]').remove();
              return false;
            }
          }
        });
        //$('main.tv-games[data-rel]').removeAttr('data-rel');
        //$('main.tv-games .mini-game__result').remove();
      }
      if (elem.length) {
        elem.toggleClass('active',this.isFriendsTvPage());
        return;
      }
      $(`<a href="/games#friends" class="tv-channel lichessTools-friends"><span data-icon="&#xE065;"><span><strong></strong></span></span></a>`)
        .attr('title',trans.noarg('friendsButtonTitle'))
        .insertAfter($('a.best',container))
        .toggleClass('active',this.isFriendsTvPage())
        .find('strong').text(trans.noarg('friends'));
    };

    getUsers=(el)=>{
      return $('span.mini-game__user',el).get()
               .map(e=>{
                 const cl=$(e).clone();
                 cl.find('span:not(.lichessTools-userText),img').remove();
                 return this.getUserId(cl.text().trim());  
               });
    };

    updateFriendsTvPageDirect = async ()=>{
      const parent=this.lichessTools;
      const $=parent.$;
      const trans=this.lichessTools.translator;
      if (!this.isFriendsTvPage()) return;
      if (parent.global.document.hidden) return;
      const container = $('main.tv-games div.page-menu__content.now-playing');
      if (!container.length) return;
      container.toggleClass('lichessTools-friendsTv',this.options.enabled);
      const notFound=[...this.users_playing];
      $('a.mini-game',container).each((i,e)=>{
        const users=this.getUsers(e);
        const friends=users.filter(u=>this.users_playing.includes(u));
        if (friends.length) {
          parent.arrayRemoveAll(notFound,u=>friends.includes(u));
        } else {
          $(e).remove();
        }
      });
      for (const userId of notFound) {
        try {
          const text = await parent.net.fetch({url:'/@/{username}/mini',args:{username:userId}});
          if (!text) continue;
          const html=$('<x>'+text+'</x>').find('a.mini-game');
          if (!html.length) continue;

          $('label.lichessTools-noGames',container).remove();
          if (!$('a.mini-game[data-userId="'+userId+'"]',container).length) {
            $(html).attr('data-userId',userId).appendTo(container);
            parent.lichess.contentLoaded();
            await parent.timeout(500);
          }
        } catch(e) {
          console.warn('Error getting TV game for ',userId,e);
        }
      }
      if ($('a.mini-game',container).length) {
        $('label.lichessTools-noGames',container).remove();
      } else if (!$('label.lichessTools-noGames',container).length) {
        $('<label class="lichessTools-noGames">')
          .text(trans.noarg('noGames'))
          .appendTo(container);
      }
    };
    updateFriendsTvPage=this.lichessTools.debounce(this.updateFriendsTvPageDirect,500);

    getUserId=(user)=>user?.toLowerCase().replace(/^\w+\s/, '');

    users_playing=[];

    following_onlines=(friends,data)=>{
      if (this.onlinesInterval) {
        clearInterval(this.onlinesInterval);
        this.onlinesInterval=0;
      }
      const parent=this.lichessTools;
      const $=parent.$;
      this.users_playing=data?.playing?.map(this.getUserId)||[];
      this.updateFriendsTvPage();
    };
    enters=(userName,data)=>{
      const parent=this.lichessTools;
      const userId=this.getUserId(userName);
      const isPlaying=data?.playing;
      if (isPlaying) {
        this.users_playing.push(userId);
        this.updateFriendsTvPage();
      }
    };
    leaves=(user)=>{
      const parent=this.lichessTools;
      const userId=this.getUserId(user);
      parent.arrayRemoveAll(this.users_playing,u=>u===userId);
      this.updateFriendsTvPage();
    };
    playing=(user)=>{
      const userId=this.getUserId(user);
      this.users_playing.push(userId);
      this.updateFriendsTvPage();
    };
    stopped_playing=(user)=>{
      const parent=this.lichessTools;
      const userId=this.getUserId(user);
      parent.arrayRemoveAll(this.users_playing,u=>u===userId);
      this.updateFriendsTvPage();
    };

    requestOnlines=this.lichessTools.debounce(()=>this.lichessTools.lichess.pubsub.emit("socket.send", "following_onlines"),250);
    
    hashChange = ()=>{
      if (this.isFriendsTvPage()) {
        this.updateFriendsTvButton();
        this.updateFriendsTvPage();
      }
    };

    reconnected = ()=>{
      const parent=this.lichessTools;
      const $=parent.$;
      if (!this.isFriendsTvPage()) return;
      const container = $('main.tv-games div.page-menu__content.now-playing');
      container.empty();
            
      this.hashChange();
    };
    
    
    async start() {
      const parent=this.lichessTools;
      const $=parent.$;
      const value=parent.currentOptions.getValue('friendsTv');
      this.logOption('Friends TV', value);
      this.options={ enabled: !!value };
      const lichess=parent.lichess;
      if (!lichess) return;
      lichess.pubsub.off('socket.in.following_onlines', this.following_onlines);
      lichess.pubsub.off('socket.in.following_enters', this.enters);
      lichess.pubsub.off('socket.in.following_leaves', this.leaves);
      lichess.pubsub.off('socket.in.following_playing', this.playing);
      lichess.pubsub.off('socket.in.following_stopped_playing', this.stopped_playing);
      $(parent.global).off('hashchange',this.hashChange);
      lichess.pubsub.off('socket.open',this.reconnected);
      if (value) {
        lichess.pubsub.on('socket.open',this.reconnected);
        lichess.pubsub.on('socket.in.following_onlines', this.following_onlines);
        lichess.pubsub.on('socket.in.following_enters', this.enters);
        lichess.pubsub.on('socket.in.following_leaves', this.leaves);
        lichess.pubsub.on('socket.in.following_playing', this.playing);
        lichess.pubsub.on('socket.in.following_stopped_playing', this.stopped_playing);

        $(parent.global).on('hashchange',this.hashChange);
      }

      this.updateFriendsTvButton();
      //this.updateFriendsTvPage();
      this.onlinesInterval=setInterval(()=>{
        if (!this.onlinesInterval) return;
        this.requestOnlines();
      },1000);

    }
  }
  LiChessTools.Tools.FriendsTv=FriendsTvTool;
})();
