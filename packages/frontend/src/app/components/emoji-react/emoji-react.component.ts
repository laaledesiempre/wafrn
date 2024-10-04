import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostsService } from 'src/app/services/posts.service';
import { MessageService } from 'src/app/services/message.service';
// TODO angular and services imports
//corrected
//
import { LoaderComponent, EmojiCollectionsComponent } from 'src/app/components';
import { Emoji } from 'src/app/interfaces';

@Component({
  selector: 'app-emoji-react',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    EmojiCollectionsComponent,
    FontAwesomeModule,
    OverlayModule,
    LoaderComponent,
    MatTooltipModule,
  ],
  templateUrl: './emoji-react.component.html',
  styleUrl: './emoji-react.component.scss',
})
export class EmojiReactComponent {
  scrollStrategy;

  @Input() postId: string = '';
  isOpen = false;
  loading = false;

  constructor(
    private overlay: Overlay,
    private postsService: PostsService,
    private messages: MessageService
  ) {
    this.scrollStrategy = this.overlay.scrollStrategies.reposition();
  }

  async reactToPost(emoji: Emoji) {
    this.loading = true;
    const response = await this.postsService.emojiReactPost(this.postId, emoji.name);
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: `Reacted with ${emoji.name} succesfully`,
      });
      this.isOpen = false;
      this.loading = false;
    } else {
      this.messages.add({
        severity: 'error',
        summary: `Something went wrong!`,
      });
      this.loading = false;
    }
  }

  openOverlay() {
    this.isOpen = !this.isOpen;
    // TODO it would be cool/nice to only allow SOME scroll before it closed.
    // that would require some subscriptions and stuff that could be hacky tho
  }
}
