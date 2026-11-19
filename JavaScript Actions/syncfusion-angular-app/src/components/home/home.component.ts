import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type ResourceIcon = 'play' | 'doc' | 'sparkle' | 'puzzle';
type ResourceTone = 'blue' | 'orange' | 'cyan' | 'gray';

interface ResourceLink {
  icon: ResourceIcon;
  title: string;
  description: string;
  link: string;
  tone: ResourceTone;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent {
  resourceLinks: ResourceLink[] = [
    {
      icon: 'play',
      title: 'Explore the Demos',
      description: 'See our UI components in action with real-world industry examples.',
      link: 'https://ej2.syncfusion.com/angular/demos/',
      tone: 'blue'
    },
    {
      icon: 'doc',
      title: 'Explore the Docs',
      description: 'Comprehensive guides and API references for every control.',
      link: 'https://ej2.syncfusion.com/angular/documentation/introduction',
      tone: 'orange'
    },
    {
      icon: 'sparkle',
      title: 'AI Prompting',
      description: 'Harness the power of AI with our curated integration patterns.',
      link: 'https://ej2.syncfusion.com/angular/documentation/ai-tools/ai-powered-development',
      tone: 'cyan'
    },
    {
      icon: 'puzzle',
      title: 'Angular UI Components',
      description: 'Access 80+ high-performance Angular components today for faster development.',
      link: 'https://www.syncfusion.com/angular-components',
      tone: 'gray'
    }
  ];
}
