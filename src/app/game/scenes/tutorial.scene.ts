import Phaser from 'phaser';

type TutData = {
  onComplete?: (state:'skipped'|'completed') => void;
  getTargetBounds?: (key: string) => Phaser.Geom.Rectangle | null;
};

type Step = {
  html: string;
  onEnter?: () => void;
  panelAt?: { x: number, y: number };
};

export class TutorialScene extends Phaser.Scene {
  private done = false;
  private stepIndex = 0;
  private steps: Step[] = [];

  private dialogReady = false;

  // Réfs UI
  private panel!: Phaser.GameObjects.Rectangle;
  private profileBg!: Phaser.GameObjects.Rectangle;
  private profilePic!: Phaser.GameObjects.Image;
  private textBg!: Phaser.GameObjects.Rectangle;
  private dom!: Phaser.GameObjects.DOMElement;
  private nextIcon!: Phaser.GameObjects.Sprite;

  // Surbrillance
  private veil!: Phaser.GameObjects.Graphics;
  private holeG?: Phaser.GameObjects.Graphics;
  private holeMask?: Phaser.Display.Masks.GeometryMask;
  private holeBorder?: Phaser.GameObjects.Graphics;
  private borderTween?: Phaser.Tweens.Tween;

  // Data passé par la scène appelante (toujours défini)
  private tutData: TutData = {};

  constructor() { super('TutorialScene'); }

  preload() {
    this.load.image('profile', 'assets/mascotte/mascotteHappy.png');
    this.load.spritesheet('next', 'assets/icons/nextDialogSpriteSheet.png', { frameWidth: 16, frameHeight: 16 });
  }

  create(data: TutData = {}) {
    this.tutData = data ?? {};

    const W = this.scale.width;
    const H = this.scale.height;

    // Voile plein écran
    this.veil = this.add.graphics().setDepth(1);
    this.veil.fillStyle(0x000000, 0.6).fillRect(0, 0, W, H);

    // --- Panneau / éléments ---
    this.panel = this.add.rectangle(W / 1.625, H / 1.25, 900, 220, 0x1a1a1a, 0.95)
      .setStrokeStyle(2, 0xF7A03C).setDepth(2);

    this.layoutDialogAt(this.panel.x, this.panel.y);

    this.profileBg = this.add.rectangle(this.panel.x - 335, this.panel.y, 175, 175, 0x000000, 0.85)
      .setStrokeStyle(2, 0xF7A03C).setDepth(2);

    this.profilePic = this.add.image(this.profileBg.x, this.profileBg.y, 'profile')
      .setDepth(2).setScale(1.35);

    this.textBg = this.add.rectangle(this.panel.x + 100, this.panel.y, 640, 175, 0x000000, 0.85)
      .setStrokeStyle(2, 0xF7A03C).setDepth(2)
      .setInteractive({ useHandCursor: true });

    // HTML riche (DOMElement) dans la zone texte
    const PADDING = 12;
    const area = this.textBg.getBounds();
    this.dom = this.add.dom(area.x + PADDING, area.y + PADDING)
      .createFromHTML(this.makeHTML('…'))
      .setOrigin(0, 0).setDepth(4);

    // Click n’importe où dans la zone pour aller au step suivant
    this.dom.addListener('click');
    this.dom.on('click', (e: any) => {
      const el = e.target as HTMLElement;
      if (el.matches('[data-action="skip"]')) {
        e.preventDefault();
        this.finish('skipped');
      } else {
        this.nextStep();
      }
    });

    // (En plus) clique sur le fond textuel
    this.textBg.on('pointerup', () => this.nextStep());

    // Anim “next” (chevrons)
    if (!this.anims.exists('nextBlink')) {
      this.anims.create({
        key: 'nextBlink',
        frames: this.anims.generateFrameNumbers('next', { start: 0, end: 6 }),
        frameRate: 6,
        repeat: -1
      });
    }
    this.nextIcon = this.add.sprite(this.panel.x + 395, this.panel.y + 65, 'next')
      .setScale(1.5).setDepth(3).play('nextBlink');

    this.dialogReady = true;

    // Steps : 1) intro, 2) spotlight 1er événement
    this.steps = [
      {
        html:
          `Bienvenue sur <span style="color:#F7A03C;font-weight:600;">Romet</span> !<br><br>
           Ceci est un <b>tutoriel</b> pour vous aider lors de votre partie.<br>
           Vous pouvez <a href="#" data-action="skip" style="color:#F7A03C;text-decoration:underline;">passer le tutoriel</a>
           à tout moment.`,
      },
      {
        html:
          `Pour commencer,<br> nous allons voir ensemble à quoi correspondent les 
          informations visibles sur <span style="color:#F7A03C;">l'interface</span> à gauche de l'écran.`,
        onEnter: () => {
          this.makeHoleAt(12.5, 12.5, 245, 385);
        }
      },
      {
        html:
          `L'élement que tu apperçois en surbrillance indique la <span style="color:#F7A03C;">position</span> à laquelle 
          tu te trouves dans le casino.<br> 
          Ici, 0-1 car tu ne t'es pas encore déplacé.`,
          onEnter: () => {
            this.makeHoleAt(12.5, 12.5, 245, 85);
          }
      },
      {
        html:
          `Celui-ci indique le <span style="color:#F7A03C;">score</span> de la main que tu t'apprêtes à jouer en temps réel.<br> 
          Actuellement, le <span style="color:#F7A03C;">score</span> est de 0 car tu n'as pas encore de cartes.`,
          onEnter: () => {
            this.makeHoleAt(12.5, 112.5, 245, 85);
          }
      },
      {
        html:
          `Celui là indique les <span style="color:#F7A03C;">points de vie</span> dont tu dispose pour finir la partie.<br> 
          Actuellement, tu as 100 <span style="color:#F7A03C;">points de vie</span>.<br>`,
          onEnter: () => {
            this.makeHoleAt(12.5, 212.5, 245, 85);
          }
      },
      {
        html:
          `Et pour finir, tu peux voir ici <span style="color:#F7A03C;">l'argent</span> que tu possèdes.<br> Actuellement, tu as 0 <span style="color:#F7A03C;">or</span>.`,
          onEnter: () => {
            this.makeHoleAt(12.5, 312.5, 125, 85);
          }
      },
      {
        html:
          `Et ici le nombre de <span style="color:#F7A03C;">défausses</span> qu'il te reste.<br> Actuellement, tu en a 0 car le jeu n'a
          pas encore commencé.<br> 
          Tu disposes de 2 <span style="color:#F7A03C;">défausses</span> par table par défaut.`,
          onEnter: () => {
            this.makeHoleAt(132.5, 312.5, 125, 85);
          }
      },
      {
        html:
          `oui`,
          onEnter: () => {
            this.makeHoleAt(551, 515, 65, 65);
          },
          panelAt: { x: 775, y: 225 },
      }
    ];

    // Applique le premier step
    this.applyStep(this.steps[0]);

    this.input.setTopOnly(true); // l’overlay capte les clics
  }

  // ——— Step management ———
  private nextStep() {
    if (this.done) return;

    // Nettoie un éventuel trou du step courant
    this.clearHole();
    this.input.setTopOnly(true);

    this.stepIndex++;
    if (this.stepIndex >= this.steps.length) {
      this.finish('completed');
      return;
    }
    this.applyStep(this.steps[this.stepIndex]);
  }

  private applyStep(step: Step) {
    // 1) Déplacer la box AVANT toute lecture de bounds
    if (step.panelAt) {
      const { x, y } = step.panelAt;
      this.moveDialogTo(x, y); // instantané
    }

    // 2) Mettre à jour le DOM en fonction de la NOUVELLE position
    const PADDING = 12;
    const a = this.textBg.getBounds();
    const el = this.dom.node as HTMLElement;
    el.style.width  = `${a.width  - PADDING * 2}px`;
    el.style.height = `${a.height - PADDING * 2}px`;
    el.innerHTML    = this.makeHTML(step.html);
    this.dom.setPosition(a.x + PADDING, a.y + PADDING);

    // 3) Hooks (spotlight, etc.)
    step.onEnter?.();
  }

  private makeHTML(inner: string) {
    return `
    <div style="
      width:100%;
      height:100%;
      overflow:hidden;
      color:#fff;
      font-family: romet, monospace;
      font-size:24px;
      line-height:1.25;
      user-select:none;
    ">
      ${inner}
    </div>`;
  }

  private finish(state: 'skipped'|'completed') {
    this.done = true;
    this.clearHole(); // s'assure que le masque est retiré
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.tutData?.onComplete?.(state);
      this.scene.stop();
    });
  }

  private makeHole(rect: Phaser.Geom.Rectangle, radius: number = 12) {
    this.clearHole();

    // Graphics blanc = shape du masque
    this.holeG = this.add.graphics();
    this.holeG.fillStyle(0xffffff, 1);
    this.holeG.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
    this.holeG.setVisible(false);

    // Applique le mask inversé sur le voile
    this.holeMask = new Phaser.Display.Masks.GeometryMask(this, this.holeG);
    this.holeMask.setInvertAlpha(true);
    this.veil.setMask(this.holeMask);

    // --- Bordure néon ---
    this.holeBorder = this.add.graphics().setDepth(5);
    this.holeBorder.lineStyle(4, 0xffffff, 1); // épaisseur 4px, blanc
    this.holeBorder.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);

    // Animation pour donner un effet "néon pulsant"
    this.borderTween = this.tweens.add({
      targets: this.holeBorder,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  private makeHoleAt(x: number, y: number, w: number, h: number) {
    this.makeHole(new Phaser.Geom.Rectangle(x, y, w, h));
  }

  /** Retire le trou et libère les ressources. */
  private clearHole() {
    (this.veil as any)?.clearMask?.(true);
    this.holeMask?.destroy();
    this.holeG?.destroy();
    this.holeMask = undefined;
    this.holeG = undefined;

    this.borderTween?.stop();
    this.holeBorder?.destroy();
    this.holeBorder = undefined;
    this.borderTween = undefined;
  }

  private layoutDialogAt(x: number, y: number) {
    if (!this.dialogReady || !this.panel || !this.profileBg || !this.profilePic || !this.textBg || !this.nextIcon) {
      return; // on sort si tout n'est pas prêt
    }

    this.panel.setPosition(x, y);
    this.profileBg.setPosition(this.panel.x - 335, this.panel.y);
    this.profilePic.setPosition(this.profileBg.x, this.profileBg.y);
    this.textBg.setPosition(this.panel.x + 100, this.panel.y);
    this.nextIcon.setPosition(this.panel.x + 395, this.panel.y + 65);
  }

  private moveDialogTo(x: number, y: number) {
    this.layoutDialogAt(x, y);
  }
}