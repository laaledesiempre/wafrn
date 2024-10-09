import { Injectable } from '@angular/core';
import * as dompurify from 'isomorphic-dompurify'
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { 
  ProcessedPost,
  RawPost,
  PostEmojiReaction,
  unlinkedPosts,
  SimplifiedUser,
  UserOptions,
  Emoji,
  EmojiCollection
} from '../interfaces';
// TODO service imports
import { MediaService } from './media.service';
import { JwtService } from './jwt.service';
import { MessageService } from './message.service';

import { environment } from 'src/environments/environment';

import { emojis } from '../lists/emoji-compact';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  processedQuotes: ProcessedPost[] = [];
  parser = new DOMParser();
  wafrnMediaRegex =
    /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm;
  youtubeRegex =
    /((?:https?:\/\/)?(www.|m.)?(youtube(\-nocookie)?\.com|youtu\.be)\/(v\/|watch\?v=|embed\/)?([\S]{11}))([^\S]|\?[\S]*|\&[\S]*|\b)/g;
  public updateFollowers: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public postLiked: BehaviorSubject<{ id: string; like: boolean }> =
    new BehaviorSubject<{ id: string; like: boolean }>({
      id: 'undefined',
      like: false,
    });

  public emojiReacted = new BehaviorSubject<{
    postId: string;
    emoji: Emoji;
    type: 'react' | 'undo_react';
  }>({
    postId: '',
    emoji: {
      id: '',
      url: '',
      name: '',
      external: false,
    },
    type: 'react',
  });

  public rewootedPosts: string[] = [];


  keyboardEmojis: Emoji[] = emojis.map(emoji => {
    return {
      id: emoji.char,
      name: emoji.category + emoji.name, // todo add a display name?
      url: '',
      external: false
    }
  });

  public silencedPostsIds: string[] = [];
  public mutedUsers: string[] = [];
  public followedUserIds: Array<string> = [];
  public emojiCollections: EmojiCollection[] = [];
  public notYetAcceptedFollowedUsersIds: Array<string> = [];
  public blockedUserIds: Array<string> = [];
  constructor(
    private mediaService: MediaService,
    private http: HttpClient,
    private jwtService: JwtService,
    private messageService: MessageService
  ) {
    this.loadFollowers();
  }

  async loadFollowers() {
    if (this.jwtService.tokenValid()) {
      const followsAndBlocks = await firstValueFrom(
        this.http.get<{
          followedUsers: string[];
          blockedUsers: string[];
          notAcceptedFollows: string[];
          options: UserOptions[];
          silencedPosts: string[];
          emojis: EmojiCollection[];
          mutedUsers: string[];
        }>(`${environment.baseUrl}/my-ui-options`)
      );
      this.emojiCollections = followsAndBlocks.emojis ? followsAndBlocks.emojis : [];
      this.emojiCollections = this.emojiCollections.concat({
        name: 'Keyboard Emojis',
        comment: 'Your phone emojis',
        emojis: this.keyboardEmojis
      })
      this.followedUserIds = followsAndBlocks.followedUsers;
      this.blockedUserIds = followsAndBlocks.blockedUsers;
      this.notYetAcceptedFollowedUsersIds = followsAndBlocks.notAcceptedFollows;
      this.mutedUsers = followsAndBlocks.mutedUsers;
      // Here we check user options
      if (followsAndBlocks.options?.length > 0) {
        // frontend options start with wafrn.
        const options = followsAndBlocks.options;
        options
          .filter((option) => option.optionName.startsWith('wafrn.'))
          .forEach((option) => {
            localStorage.setItem(
              option.optionName.split('wafrn.')[1],
              option.optionValue
            );
          });
      }
      if (followsAndBlocks.silencedPosts) {
        this.silencedPostsIds = followsAndBlocks.silencedPosts
      } else {
        this.silencedPostsIds = [];
      }
      this.updateFollowers.next(true);
    }
  }

  async followUser(id: string): Promise<boolean> {
    let res = false;
    const payload = {
      userId: id,
    };
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean }>(
          `${environment.baseUrl}/follow`,
          payload
        )
      );
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception);
    }

    return res;
  }

  async unfollowUser(id: string): Promise<boolean> {
    let res = false;
    const payload = {
      userId: id,
    };
    try {
      const response = await this.http
        .post<{ success: boolean }>(`${environment.baseUrl}/unfollow`, payload)
        .toPromise();
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception);
    }

    return res;
  }

  async likePost(id: string): Promise<boolean> {
    let res = false;
    const payload = {
      postId: id,
    };
    try {
      const response = await this.http
        .post<{ success: boolean }>(`${environment.baseUrl}/like`, payload)
        .toPromise();
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception);
    }
    this.postLiked.next({
      id: id,
      like: true,
    });
    return res;
  }

  async unlikePost(id: string): Promise<boolean> {
    let res = false;
    const payload = {
      postId: id,
    };
    try {
      const response = await this.http
        .post<{ success: boolean }>(`${environment.baseUrl}/unlike`, payload)
        .toPromise();
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception);
    }
    this.postLiked.next({
      id: id,
      like: false,
    });
    return res;
  }

  async emojiReactPost(postId: string, emojiName: string, undo = false): Promise<boolean> {
    let res = false;
    const payload = {
      postId: postId,
      emojiName: emojiName,
      undo: undo
    };
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean }>(
          `${environment.baseUrl}/emojiReact`,
          payload
        )
      );
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception);
    }
    let allEmojis: Emoji[] = [];
    this.emojiCollections.forEach(col => allEmojis = allEmojis.concat(col.emojis))
    this.emojiReacted.next({
      type: 'react',
      postId: postId,
      emoji: allEmojis.find(elem => elem.name === emojiName) as Emoji,
    });

    return res;
  }

  processPostNew(unlinked: unlinkedPosts): ProcessedPost[][] {
    this.processedQuotes = unlinked.quotedPosts.map((quote) =>
      this.processSinglePost({ ...unlinked, posts: [quote] })
    );
    const res = unlinked.posts.map((elem) => {
      const processed = elem.ancestors
        ? elem.ancestors.map((anc) =>
          this.processSinglePost({ ...unlinked, posts: [anc] })
        )
        : [];
      processed.push(
        this.processSinglePost({
          ...unlinked,
          posts: [elem],
        })
      );
      return processed.sort((a, b) => {
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    });
    return res.sort((a, b) => {
      return (
        b[b.length - 1].createdAt.getTime() -
        a[a.length - 1].createdAt.getTime()
      );
    });
  }

  processSinglePost(unlinked: unlinkedPosts): ProcessedPost {
    const elem = unlinked.posts[0];
    this.rewootedPosts = this.rewootedPosts.concat(unlinked.rewootIds)
    const user = unlinked.users.find((usr) => usr.id === elem.userId);
    const userEmojis = unlinked.emojiRelations.userEmojiRelation.filter(
      (elem) => elem.userId === user?.id
    );
    const polls = unlinked.polls.filter((poll) => poll.postId === elem.id);
    const medias = unlinked.medias.filter((media) => {
      return media.postId === elem.id
    });
    if (userEmojis && userEmojis.length && user?.name) {
      userEmojis.forEach((usrEmoji) => {
        const emoji = unlinked.emojiRelations.emojis.find(
          (emojis) => emojis.id === usrEmoji.emojiId
        );
        if (emoji) {
          user.name = user.name.replaceAll(emoji.name, this.emojiToHtml(emoji));
        }
      });
    }
    const nonExistentUser = {
      avatar: '',
      url: 'ERROR',
      name: 'ERROR',
      id: '42',
    };
    const mentionedUsers = unlinked.mentions
      .filter((mention) => mention.post === elem.id)
      .map((mention) =>
        unlinked.users.find((usr) => usr.id === mention.userMentioned)
      )
      .filter((mention) => mention !== undefined);
    let emojiReactions: PostEmojiReaction[] =
      unlinked.emojiRelations.postEmojiReactions.filter(
        (emoji) => emoji.postId === elem.id
      );
    const likesAsEmojiReactions: PostEmojiReaction[] = unlinked.likes
      .filter((like) => like.postId === elem.id)
      .map((likeUserId) => {
        return {
          emojiId: 'Like',
          postId: elem.id,
          userId: likeUserId.userId,
          content: '♥️',
          //emoji?: Emoji;
          user: unlinked.users.find((usr) => usr.id === likeUserId.userId),
        };
      });
    emojiReactions = emojiReactions.map((react) => {
      return {
        ...react,
        emoji: unlinked.emojiRelations.emojis.find(
          (emj) => emj.id === react.emojiId
        ),
        user: unlinked.users.find((usr) => usr.id === react.userId),
      };
    });
    emojiReactions = emojiReactions.concat(likesAsEmojiReactions);
    const newPost: ProcessedPost = {
      ...elem,
      emojiReactions: emojiReactions,
      user: user ? user : nonExistentUser,
      tags: unlinked.tags.filter((tag) => tag.postId === elem.id),
      descendents: [],
      userLikesPostRelations: unlinked.likes
        .filter((like) => like.postId === elem.id)
        .map((like) => like.userId),
      emojis: unlinked.emojiRelations.postEmojiRelation.map((elem) =>
        unlinked.emojiRelations.emojis.find((emj) => emj.id === elem.emojiId)
      ) as Emoji[],
      createdAt: new Date(elem.createdAt),
      updatedAt: new Date(elem.updatedAt),
      notes: elem.notes ? elem.notes : 0,
      remotePostId: elem.remotePostId
        ? elem.remotePostId
        : `${environment.frontUrl}/post/${elem.id}`,
      medias: medias.sort((a, b) => a.mediaOrder - b.mediaOrder),
      questionPoll: polls.length > 0 ? { ...polls[0], endDate: new Date(polls[0].endDate) } : undefined,
      mentionPost: mentionedUsers as SimplifiedUser[],
      quotes: unlinked.quotes
        .filter((quote) => quote.quoterPostId === elem.id)
        .map(
          (quote) =>
            this.processedQuotes.find(
              (pst) => pst.id === quote.quotedPostId
            ) as ProcessedPost
        ),
    };
    if (unlinked.asks) {
      const ask = unlinked.asks.find(ask => ask.postId === newPost.id)
      if (ask) {
        const user = unlinked.users.find(usr => usr.id === ask.userAsker)
        ask.user = user;
      }
      newPost.ask = ask
    }
    return newPost;
  }

  getPostHtml(post: ProcessedPost): string {
    const content = post.content;
    let sanitized = dompurify.sanitize(content, {
      ALLOWED_TAGS: [
        'b',
        'i',
        'u',
        'a',
        's',
        'del',
        'span',
        'br',
        'p',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'pre',
        'strong',
        'em',
        'ul',
        'li',
        'marquee',
        'font',
        'blockquote',
      ],
      ALLOWED_ATTR: ['href', 'color'],
    });
    // we remove stuff like img and script tags. we only allow certain stuff.
    const parsedAsHTML = this.parser.parseFromString(sanitized, 'text/html');
    const links = parsedAsHTML.getElementsByTagName('a');
    const mentionedRemoteIds = post.mentionPost
      ? post.mentionPost?.map((elem) => elem.remoteId)
      : [];
    const mentionRemoteUrls = post.mentionPost
      ? post.mentionPost?.map((elem) => elem.url)
      : [];
    const mentionedHosts = post.mentionPost
      ? post.mentionPost?.map(
        (elem) =>
          this.getURL(
            elem.remoteId
              ? elem.remoteId
              : 'https://adomainthatdoesnotexist.google.com'
          ).hostname
      )
      : [];
    Array.from(links).forEach((link) => {
      const youtubeMatch = link.href.matchAll(this.youtubeRegex);
      if (link.innerText === link.href && youtubeMatch) {
        Array.from(youtubeMatch).forEach((youtubeString) => {
          link.innerHTML = `<div class="watermark"><!-- Watermark container --><div class="watermark__inner"><!-- The watermark --><div class="watermark__body"><img alt="youtube logo" class="yt-watermark" loading="lazy" src="/assets/img/youtube_logo.png"></div></div><img class="yt-thumbnail" src="${environment.externalCacheurl +
            encodeURIComponent(
              `https://img.youtube.com/vi/${youtubeString[6]}/hqdefault.jpg`
            )
            }" loading="lazy" alt="Thumbnail for video"></div>`;
        });
      }
      // replace mentioned users with wafrn version of profile.
      // TODO not all software links to mentionedProfile
      if (mentionedRemoteIds.includes(link.href)) {
        if (post.mentionPost) {
          const mentionedUser = post.mentionPost.find(
            (elem) => elem.remoteId === link.href
          );
          if (mentionedUser) {
            link.href = `${environment.frontUrl}/blog/${mentionedUser.url}`;
          }
        }
      }
      const linkAsUrl: URL = this.getURL(link.href);
      if (mentionedHosts.includes(linkAsUrl.hostname)) {
        const sanitizedContent = dompurify.sanitize(link.innerHTML, {
          ALLOWED_TAGS: [],
        });
        if (
          sanitizedContent.startsWith('@') &&
          mentionRemoteUrls.includes(
            `${sanitizedContent}@${linkAsUrl.hostname}`
          )
        ) {
          link.href = `/blog/${sanitizedContent}@${linkAsUrl.hostname}`;
        }
        if (
          sanitizedContent.startsWith('@') &&
          mentionRemoteUrls.includes(`${sanitizedContent}`)
        ) {
          link.href = `/blog/${sanitizedContent}`;
        }
      }
      link.target = '_blank';
      sanitized = parsedAsHTML.documentElement.innerHTML;
    });

    sanitized = sanitized.replaceAll(this.wafrnMediaRegex, '');

    post.emojis.forEach((emoji) => {
      const strToReplace = emoji.name.startsWith(':')
        ? emoji.name
        : `:${emoji.name}:`;
      sanitized = sanitized.replaceAll(strToReplace, this.emojiToHtml(emoji));
    });

    return sanitized;
  }

  getPostContentSanitized(content: string): string {
    return dompurify.sanitize(content);
  }

  async loadRepliesFromFediverse(id: string) {
    return await this.http
      .get(`${environment.baseUrl}/loadRemoteResponses?id=${id}`)
      .toPromise();
  }

  getURL(urlString: string): URL {
    let res = new URL(environment.frontUrl);
    try {
      res = new URL(urlString);
    } catch (error) {
      console.log('Invalid url: ' + urlString);
    }
    return res;
  }

  async getDescendents(id: string): Promise<{ descendents: RawPost[] }> {
    const response = await firstValueFrom(
      this.http.get<unlinkedPosts>(
        environment.baseUrl + '/v2/descendents/' + id
      )
    );
    const res: { descendents: RawPost[] } = { descendents: [] };
    if (response) {
      const emptyUser: SimplifiedUser = {
        id: '42',
        url: 'ERROR_GETTING_USER',
        avatar: '',
        name: 'ERROR',
      };
      res.descendents = response.posts
        .map((elem) => {
          const user = response.users.find((usr) => usr.id === elem.userId);
          return {
            id: elem.id,
            content: elem.len ? 'A' : '', // HACK I know this is ugly but because legacy reasons reblogs are empty posts
            user: user ? user : emptyUser,
            content_warning: '',
            createdAt: new Date(elem.createdAt),
            updatedAt: new Date(elem.updatedAt),
            userId: elem.userId,
            hierarchyLevel: 69, // yeah I know
            postTags: [],
            privacy: elem.privacy,
            notes: 69,
            userLikesPostRelations: [],
            emojis: [],
          };
        })
        .sort((b, a) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    return res;
  }

  async unsilencePost(postId: string): Promise<boolean> {
    const payload = {
      postId: postId,
    };
    const response = await firstValueFrom(
      this.http.post<{ success: boolean }>(
        `${environment.baseUrl}/v2/unsilencePost`,
        payload
      )
    );
    await this.loadFollowers();
    return response.success;
  }

  async silencePost(postId: string, superMute = false): Promise<boolean> {
    const payload = {
      postId: postId,
      superMute: superMute.toString().toLowerCase()
    };
    const response = await firstValueFrom(
      this.http.post<{ success: boolean }>(
        `${environment.baseUrl}/v2/silencePost`,
        payload
      )
    );
    await this.loadFollowers();
    return response.success;
  }

  async voteInPoll(pollId: number, votes: number[]) {
    let res = false;
    const payload = {
      votes: votes,
    };
    try {
      const response = await firstValueFrom(this.http.post<{ success: boolean, message?: string }>(`${environment.baseUrl}/v2/pollVote/${pollId}`, payload))
      res = response.success
      this.messageService.add({ severity: res ? 'success' : 'error', summary: response.message ? response.message : res ? 'You voted succesfuly. It can take some time to display' : 'Something went wrong' })
    } catch (error) {
      console.error(error)
      this.messageService.add({ severity: 'error', summary: 'Something went wrong' })
    }
    return res;
  }

  emojiToHtml(emoji: Emoji): string {
    return `<img class="post-emoji" src="${environment.externalCacheurl +
      (emoji.external
        ? encodeURIComponent(emoji.url)
        : encodeURIComponent(environment.baseMediaUrl + emoji.url))
      }">`;
  }

  postContainsBlockedOrMuted(post: ProcessedPost[], isDashboard: boolean) {
    let res = false;
    post.forEach((fragment) => {
      if (this.blockedUserIds.includes(fragment.userId)) {
        res = true;
      }
      if (isDashboard && this.mutedUsers.includes(fragment.userId)) {
        res = true;
      }
    });
    return res;
  }
}
