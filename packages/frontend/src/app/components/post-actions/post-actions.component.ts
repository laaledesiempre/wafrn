import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { MessageService } from 'src/app/services/message.service';
import { environment } from 'src/environments/environment';
import {
  faArrowUpRightFromSquare,
  faChevronDown,
  faClockRotateLeft,
  faHeart,
  faHeartBroken,
  faShareNodes,
  faTrash,
  faTriangleExclamation,
  faPen,
  faBellSlash,
  faBell,
  faReply,
  faRepeat,
  faQuoteLeft,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditorService } from 'src/app/services/editor.service';
import { LoginService } from 'src/app/services/login.service';
import { CommonModule } from '@angular/common';
import { ReportService } from 'src/app/services/report.service';
import { DeletePostService } from 'src/app/services/delete-post.service';
import { PostsService } from 'src/app/services/posts.service';
import { UtilsService } from 'src/app/services/utils.service';
//TODO import services and interfaces
@Component({
  selector: 'app-post-actions',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, FontAwesomeModule],
  templateUrl: './post-actions.component.html',
  styleUrl: './post-actions.component.scss',
})
export class PostActionsComponent implements OnChanges{
  @Input() content!: ProcessedPost;
  userLoggedIn = false;
  myId: string = 'user-00000000-0000-0000-0000-000000000000 ';
  postSilenced = false;
  // icons
  shareIcon = faShareNodes;
  expandDownIcon = faChevronDown;
  solidHeartIcon = faHeart;
  clearHeartIcon = faHeartBroken;
  reblogIcon = faReply;
  quickReblogIcon = faRepeat;
  shareExternalIcon = faArrowUpRightFromSquare;
  goExternalPost = faGlobe;
  reportIcon = faTriangleExclamation;
  deleteIcon = faTrash;
  editedIcon = faPen;
  silenceIcon = faBellSlash;
  unsilenceIcon = faBell;
  quoteIcon = faQuoteLeft;

  constructor(
    private messages: MessageService,
    private editor: EditorService,
    private postService: PostsService,
    private loginService: LoginService,
    private reportService: ReportService,
    private deletePostService: DeletePostService,
    private utilsService: UtilsService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID();
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.checkPostSilenced()
  }

  sharePost() {
    navigator.clipboard.writeText(
      `${environment.frontUrl}/fediverse/post/${this.content.id}`
    );
    this.messages.add({
      severity: 'success',
      summary: 'The woot URL was copied to your clipboard!',
    });
  }

  shareOriginalPost() {
    navigator.clipboard.writeText(this.content.remotePostId);
    this.messages.add({
      severity: 'success',
      summary: 'The woot original URL was copied to your clipboard!',
    });
  }

  viewOriginalPost() {
    navigator.clipboard.writeText(this.content.remotePostId);
    window.open(
      this.content.remotePostId, "_blank");
  }

  async quickReblog() {
    const response = await this.editor.createPost({
      content: '',
      idPostToReblog: this.content.id,
      privacy: 0,
      media: [],
    });
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You reblogged the woot succesfully',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary:
          'Something went wrong! Check your internet conectivity and try again',
      });
    }
  }

  replyPost() {
    this.editor.replyPost(this.content);
  }
  quoteWoot() {
    this.editor.quotePost(this.content)
  }
  async unlikePost() {
    if (await this.postService.unlikePost(this.content.id)) {
      this.content.userLikesPostRelations =
        this.content.userLikesPostRelations.filter((elem) => elem != this.myId);
      this.messages.add({
        severity: 'success',
        summary: 'You successfully unliked this woot',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again',
      });
    }
  }
  async likePost() {
    if (await this.postService.likePost(this.content.id)) {
      this.content.userLikesPostRelations.push(this.myId);
      this.messages.add({
        severity: 'success',
        summary: 'You successfully liked this woot',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again',
      });
    }
  }
  reportPost() {
    this.reportService.openReportPostDialog(this.content);
  }
  editPost() {
    this.editor.replyPost(this.content, true);
  }
  deletePost() {
    this.deletePostService.openDeletePostDialog(this.content.id);
  }
  async silencePost(superMute: boolean = false) {
    if (await this.postService.silencePost(this.content.id, superMute)) {
      this.messages.add({
        severity: 'success',
        summary: 'You successfully silenced the notifications for this woot',
      });
      await this.checkPostSilenced()
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again',
      });
    }
  }

  async unsilencePost() {
    if (await this.postService.unsilencePost(this.content.id)) {
      this.messages.add({
        severity: 'success',
        summary: 'You successfully reactivated the notifications for this woot',
      });
      await this.checkPostSilenced()
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again',
      });
    }
  }

  private async checkPostSilenced() {
    this.postSilenced = (await this.utilsService.getSilencedPostIds()).includes(this.content.id)
  }
}
