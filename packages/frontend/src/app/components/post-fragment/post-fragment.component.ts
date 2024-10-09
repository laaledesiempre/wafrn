import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PostsService } from 'src/app/services/posts.service';
import { LoginService } from 'src/app/services/login.service';
import { JwtService } from 'src/app/services/jwt.service';
import { MessageService } from 'src/app/services/message.service';
import { InjectHtmlModule } from 'src/app/directives/inject-html/inject-html.module';
// todo services imports

import { environment } from 'src/environments/environment';

import {
EmojiReactComponent ,
AvatarSmallComponent ,
PostHeaderComponent ,
SingleAskComponent ,
PollModule ,
WafrnMediaModule 
} from 'src/app/components';

import { 
  SimplifiedUser,
  ProcessedPost,
  Emoji
 } from 'src/app/interfaces';

type EmojiReaction = {
  id: string;
  content: string;
  img?: string;
  external: boolean;
  name: string;
  users: SimplifiedUser[];
  tooltip: string;
  includesMe: boolean;
};

@Component({
  selector: 'app-post-fragment',
  standalone: true,
  imports: [
    CommonModule,
    PollModule,
    WafrnMediaModule,
    RouterModule,
    MatButtonModule,
    MatTooltipModule,
    EmojiReactComponent,
    InjectHtmlModule,
    AvatarSmallComponent,
    PostHeaderComponent,
    SingleAskComponent
  ],
  templateUrl: './post-fragment.component.html',
  styleUrl: './post-fragment.component.scss',
})
export class PostFragmentComponent implements OnChanges, OnDestroy {
  @Input() fragment: ProcessedPost | undefined;
  @Input() showCw: boolean = true;
  @Input() selfManageCw: boolean = false;
  @Output() dismissCw: EventEmitter<void> = new EventEmitter<void>();
  emojiCollection: EmojiReaction[] = [];
  likeSubscription;
  emojiSubscription;
  folowsSubscription;
  userId;
  avaiableEmojiNames: string[] = []

  reactionLoading = false;
  sanitizedContent = ""

  constructor(
    private postService: PostsService,
    private loginService: LoginService,
    private jwtService: JwtService,
    private messages: MessageService
  ) {
    this.folowsSubscription = this.postService.updateFollowers.subscribe((data) => {
      this.avaiableEmojiNames = []
      this.postService.emojiCollections.forEach(collection => this.avaiableEmojiNames = this.avaiableEmojiNames.concat(collection.emojis.map(elem => elem.name)))
      this.avaiableEmojiNames.push('❤️')
    })
    this.userId = loginService.getLoggedUserUUID();
    this.likeSubscription = postService.postLiked.subscribe((likeEvent) => {
      if (likeEvent.id === this.fragment?.id) {
        this.renderLikeDislike(likeEvent);
      }
    });
    this.emojiSubscription = postService.emojiReacted.subscribe(
      (emojiEvent) => {
        if (emojiEvent.postId === this.fragment?.id) {
          this.renderEmojiReact(emojiEvent);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.likeSubscription.unsubscribe();
    this.emojiSubscription.unsubscribe();
    this.folowsSubscription.unsubscribe();
  }

  ngOnChanges(): void {
    this.initializeContent()
    this.initializeEmojis();
  }

  initializeContent() {
    this.sanitizedContent = this.postService.getPostHtml(this.fragment as ProcessedPost)
  }

  initializeEmojis() {
    // using a "map" here for O(1) get operations
    const emojiReactions = {} as Record<string, EmojiReaction>;
    if (!this.fragment?.emojiReactions) {
      this.emojiCollection = [];
      return;
    }
    this.fragment.emojiReactions.forEach((reaction) => {
      const hasReaction = !!emojiReactions[reaction.content];
      if (!hasReaction) {
        let image = '';
        if (reaction.emoji?.url) {
          image = encodeURIComponent(reaction.emoji.external ? reaction.emoji.url : (environment.baseMediaUrl + reaction.emoji.url))
        }
        // create the basic structure to augment later
        emojiReactions[reaction.content] = {
          id: reaction.emojiId,
          content: reaction.content,
          external: reaction.emoji?.external == true,
          name: reaction.content,
          img: image ? `${environment.externalCacheurl}${image}&avatar=true` : undefined,
          users: [], // this will be filled below,
          tooltip: '',
          includesMe: false,
        };
      }

      // at this point the current reaction is always defined on the map
      // so we can always access it to increment the users array
      if (reaction.user?.avatar) {
        emojiReactions[reaction.content].users.push(reaction.user);
      }
    });

    this.emojiCollection = Object.values(emojiReactions).sort(
      (a, b) => b.users.length - a.users.length
    );
    for (let emoji of this.emojiCollection) {
      emoji.tooltip = (this.isLike(emoji) ? 'Liked' : emoji.content) +
        ' by ' +
        this.getTooltipUsers(emoji.users);
      emoji.includesMe = this.emojiReactionIncludesMe(emoji)
    }
  }

  getTooltipUsers(users: SimplifiedUser[]): string {
    return users.map((usr) => usr.url).join(', ');
  }

  renderLikeDislike({ like }: { id: string; like: boolean }) {
    let likesCollection = this.emojiCollection.find(
      (elem) => elem.id === 'Like'
    );
    if (like) {
      // CODE TO ADD LIKE
      if (!likesCollection) {
        likesCollection = {
          id: '=',
          content: '❤️',
          external: false,
          img: undefined,
          name: '❤️',
          users: [],
          tooltip: '',
          includesMe: false
        };
        this.emojiCollection.push(likesCollection);
      }
      likesCollection.users.push({
        url: this.jwtService.getTokenData()['url'],
        name: this.jwtService.getTokenData()['url'],
        id: this.loginService.getLoggedUserUUID(),
        avatar: '',
      });
    } else {
      // CODE TO REMOVE LIKE
      console.log(this.emojiCollection, likesCollection);
      if (likesCollection) {
        if (likesCollection.users.length === 1) {
          this.emojiCollection = this.emojiCollection.filter(
            (col) => col.id !== 'Like'
          );
        } else {
          likesCollection.users = likesCollection.users.filter(
            (usr) => usr.id !== this.loginService.getLoggedUserUUID()
          );
        }
      }
    }
  }

  renderEmojiReact({
    emoji,
    type,
  }: {
    postId: string;
    emoji: Emoji;
    type: 'react' | 'undo_react';
  }) {
    const collection = this.emojiCollection.find((e) => e.id === emoji.id);
    if (type === 'react') {
      this.fragment?.emojiReactions.push({
        emojiId: emoji.id,
        emoji: emoji,
        userId: this.loginService.getLoggedUserUUID(),
        postId: this.fragment.id,
        content: emoji.name,
        user: {
          url: this.jwtService.getTokenData()['url'],
          name: this.jwtService.getTokenData()['url'],
          id: this.loginService.getLoggedUserUUID(),
          avatar: '',
        }
      })
      console.log(this.fragment?.emojiReactions)
    } else {
      if (collection) {
        if (collection.users.length === 1) {
          this.emojiCollection = this.emojiCollection.filter(
            (col) => col.id !== emoji.id
          );
        } else {
          collection.users = collection.users.filter(
            (usr) => usr.id !== this.loginService.getLoggedUserUUID()
          );
        }
      }
    }
    this.ngOnChanges()

  }

  isLike(emojiReaction: EmojiReaction) {
    return ['♥️', '❤'].includes(emojiReaction.content);
  }

  async toggleEmojiReact(emojiReaction: EmojiReaction) {
    if (this.fragment?.userId === this.userId) {
      this.messages.add({
        severity: 'error',
        summary: `You can not emojireact to your own posts`,
      });
      return;
    }
    const postId = this.fragment?.id;
    if (!postId) {
      return;
    }

    this.reactionLoading = true;
    const reactionIsToggled = emojiReaction.users.some(
      (usr) => usr.id === this.userId
    );

    if (this.isLike(emojiReaction)) {
      if (reactionIsToggled) {
        await this.postService.unlikePost(postId);
      } else {
        await this.postService.likePost(postId);
      }
    } else {
      let response = false;
      if (reactionIsToggled) {
        response = await this.postService.emojiReactPost(postId, emojiReaction.content, true);

        if (response) {
          this.messages.add({
            severity: 'success',
            summary: `Reaction removed succesfully`,
          });
        }
      } else {
        response = await this.postService.emojiReactPost(postId, emojiReaction.content);
        if (response) {
          this.messages.add({
            severity: 'success',
            summary: `Reacted with ${emojiReaction.name} succesfully`,
          });
        }
      }

      if (!response) {
        this.messages.add({
          severity: 'error',
          summary: `Something went wrong!`,
        });
      }
    }

    this.reactionLoading = false;
  }

  emojiReactionIncludesMe(emoji: EmojiReaction) {
    return emoji.users.some((usr) => usr.id === this.userId);
  }

  cwClick() {
    this.dismissCw.emit();
    if (this.selfManageCw) {
      this.showCw = !this.showCw
    }
  }
}
