import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { MediaService } from 'src/app/services/media.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-wafrn-media',
  templateUrl: './wafrn-media.component.html',
  styleUrls: ['./wafrn-media.component.scss']
})
export class WafrnMediaComponent implements OnInit {


  @Input() id!: string;
  nsfw = true;
  data!: WafrnMedia;
  displayUrl: string = '';
  disableNSFWFilter = true;
  @ViewChild('wafrnMedia') wafrnMedia: any;
  ready = false;


  
  constructor(
    private mediaService: MediaService
  ) {
    this.disableNSFWFilter = mediaService.checkNSFWFilterDisabled();
   }

  ngOnInit(): void {

    this.data = this.mediaService.getMediaById(this.id);
    this.nsfw = this.data.NSFW && ! this.disableNSFWFilter;
    this.ready = true;

  }

  showPicture(){
    this.nsfw = false;
    this.displayUrl = this.data.url;
  }


  imgLoaded() {
    if(this.wafrnMedia.nativeElement.offsetHeight/this.wafrnMedia.nativeElement.offsetWidth > 3) {
      this.displayUrl = '';
    }
  }

}
