import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { environment } from '../../../environments/environment';

interface RagCitation { document: string; section?: string; score?: number; }
interface RagResponse {
  query: string;
  answer: string;
  citations: RagCitation[];
  provider: string;
  model: string;
  prompt_version: string;
  context?: Record<string, unknown>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  citations?: RagCitation[];
  meta?: { provider: string; model: string; promptVersion: string; };
}

@Component({
  standalone: true,
  selector: 'app-ask',
  imports: [CommonModule, FormsModule, MatButtonModule,
            MatFormFieldModule, MatInputModule, MatIconModule],
  styles: [`
    .chat-wrap {
      display: flex; flex-direction: column;
      max-width: 820px; margin: 0 auto;
      gap: 16px;
    }
    .disclaimer {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 18px;
      background: var(--color-primary-soft);
      border: 1px solid #c7d2fe;
      border-radius: var(--radius-lg);
      color: var(--color-primary-text);
      font-size: 13px; line-height: 1.55;
    }
    .disclaimer mat-icon { color: var(--color-primary); font-size: 18px; height: 18px; width: 18px; flex-shrink: 0; margin-top: 1px; }

    .messages { display: flex; flex-direction: column; gap: 20px; padding-bottom: 8px; }

    .msg { display: flex; gap: 14px; }
    .msg .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      display: grid; place-items: center;
      font-weight: 600; font-size: 12px;
      flex-shrink: 0;
    }
    .msg.user .avatar { background: var(--color-primary-soft); color: var(--color-primary-text); }
    .msg.assistant .avatar {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
    }
    .msg .body { flex: 1; }
    .msg .who { color: var(--color-text-muted); font-size: 12px; font-weight: 500; margin-bottom: 4px; }
    .msg .content {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 14px 18px;
      color: var(--color-text);
      line-height: 1.6;
      font-size: 14px;
    }
    .msg.user .content { background: var(--color-primary-soft); border-color: #c7d2fe; }

    .citations {
      margin-top: 12px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .citation {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px;
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 12.5px;
    }
    .citation .idx {
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--color-primary-soft); color: var(--color-primary-text);
      display: grid; place-items: center;
      font-weight: 600; font-size: 11px;
      flex-shrink: 0;
    }
    .citation .doc { font-weight: 500; }
    .citation .sec { color: var(--color-text-muted); font-family: var(--font-mono); font-size: 11px; }
    .citation .score {
      margin-left: auto;
      background: var(--color-surface);
      padding: 1px 8px; border-radius: 999px;
      border: 1px solid var(--color-border);
      color: var(--color-text-muted); font-size: 11px;
    }

    .meta-line {
      color: var(--color-text-muted); font-size: 11.5px; margin-top: 10px;
      display: flex; gap: 12px; flex-wrap: wrap;
    }
    .meta-line .pill { font-family: var(--font-mono); background: var(--color-surface-muted); padding: 1px 6px; border-radius: 4px; }

    /* Input */
    .composer {
      position: sticky; bottom: 0;
      padding: 12px 16px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
      display: flex; gap: 10px; align-items: center;
    }
    .composer input {
      flex: 1; border: none; outline: none; background: transparent;
      font-family: inherit; font-size: 14px; padding: 6px 8px;
      color: var(--color-text);
    }
    .composer input::placeholder { color: var(--color-text-muted); }

    .suggestions { display: flex; gap: 8px; flex-wrap: wrap; }
    .suggestion {
      padding: 6px 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 999px;
      font-size: 12.5px;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 120ms var(--ease-out);
    }
    .suggestion:hover { border-color: var(--color-primary); color: var(--color-primary-text); background: var(--color-primary-soft); }

    .typing {
      display: inline-flex; align-items: center; gap: 4px;
      color: var(--color-text-muted); font-size: 13px;
    }
    .typing .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--color-text-muted);
      animation: bounce 1.4s infinite ease-in-out;
    }
    .typing .dot:nth-child(2) { animation-delay: 0.15s; }
    .typing .dot:nth-child(3) { animation-delay: 0.30s; }
    @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
  `],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="eyebrow">Automation · RAG</div>
          <h1>Ask AI</h1>
          <p class="subtitle">Compliance-knowledge Q&A grounded in a small SOC 2 demo corpus. Every answer cites the document chunks it used.</p>
        </div>
      </div>

      <div class="chat-wrap">
        <div class="disclaimer">
          <mat-icon>info</mat-icon>
          <div>
            AI answers are advisory. They summarize the demo corpus only — always confirm with your auditor and internal policies.
            Syncpoint never claims your organization is SOC 2 compliant.
          </div>
        </div>

        <!-- Suggestions when empty -->
        <div *ngIf="!messages().length" class="suggestions">
          <button class="suggestion" *ngFor="let s of suggestions" (click)="askDirect(s)">{{ s }}</button>
        </div>

        <!-- Conversation -->
        <div class="messages" *ngIf="messages().length">
          <div *ngFor="let m of messages()" class="msg" [class.user]="m.role === 'user'" [class.assistant]="m.role === 'assistant'">
            <div class="avatar" *ngIf="m.role === 'user'">You</div>
            <div class="avatar" *ngIf="m.role === 'assistant'"><mat-icon style="font-size:16px;height:16px;width:16px;">auto_awesome</mat-icon></div>
            <div class="body">
              <div class="who">{{ m.role === 'user' ? 'You' : 'Syncpoint AI' }}</div>
              <div class="content">
                {{ m.text }}

                <div class="citations" *ngIf="m.citations?.length">
                  <div class="citation" *ngFor="let c of m.citations; let i = index">
                    <span class="idx">{{ i + 1 }}</span>
                    <span class="doc">{{ c.document }}</span>
                    <span class="sec" *ngIf="c.section">{{ c.section }}</span>
                    <span class="score" *ngIf="c.score !== undefined">score {{ c.score }}</span>
                  </div>
                </div>

                <div class="meta-line" *ngIf="m.meta">
                  <span>Provider: <span class="pill">{{ m.meta.provider }}</span></span>
                  <span>Model: <span class="pill">{{ m.meta.model }}</span></span>
                  <span>Prompt: <span class="pill">{{ m.meta.promptVersion }}</span></span>
                </div>
              </div>
            </div>
          </div>

          <div class="msg assistant" *ngIf="loading()">
            <div class="avatar"><mat-icon style="font-size:16px;height:16px;width:16px;">auto_awesome</mat-icon></div>
            <div class="body">
              <div class="who">Syncpoint AI</div>
              <div class="content">
                <span class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Composer -->
        <div class="composer">
          <mat-icon style="color:var(--color-text-muted);font-size:20px;height:20px;width:20px;">chat_bubble_outline</mat-icon>
          <input [(ngModel)]="question"
                 (keydown.enter)="ask()"
                 placeholder="Ask a compliance question…"
                 [disabled]="loading()">
          <button class="btn primary sm" (click)="ask()" [disabled]="!question.trim() || loading()">
            <mat-icon style="font-size:14px;height:14px;width:14px;">send</mat-icon>
            Ask
          </button>
        </div>

        <div *ngIf="err()" style="color:var(--color-danger-text);font-size:13px;text-align:center;">{{ err() }}</div>
      </div>
    </div>
  `,
})
export class AskComponent {
  private readonly http = inject(HttpClient);

  question = '';
  loading = signal(false);
  messages = signal<ChatMessage[]>([]);
  err = signal<string | null>(null);

  readonly suggestions = [
    'What evidence proves periodic access review?',
    'What does change management evidence look like?',
    'What is required for MFA coverage?',
    'How do I show incident response coverage?',
  ];

  askDirect(q: string): void {
    this.question = q;
    this.ask();
  }

  ask(): void {
    const q = this.question.trim();
    if (!q) return;

    this.messages.update(m => [...m, { role: 'user', text: q }]);
    this.question = '';
    this.loading.set(true);
    this.err.set(null);

    this.http.post<RagResponse>(`${environment.apiBase}/rag/query`,
        { query: q, framework: 'SOC2', topK: 4 })
      .subscribe({
        next: (r) => {
          this.messages.update(m => [...m, {
            role: 'assistant',
            text: r.answer || '(no answer)',
            citations: r.citations,
            meta: { provider: r.provider, model: r.model, promptVersion: r.prompt_version },
          }]);
        },
        error: (e) => this.err.set(e?.error?.message ?? 'AI service failed'),
        complete: () => this.loading.set(false),
      });
  }
}
