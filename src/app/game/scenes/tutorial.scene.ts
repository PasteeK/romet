import Phaser from 'phaser';

// Type de données de tutorial
type TutData = {
  onComplete?: (state:'skipped'|'completed') => void;
  getTargetBounds?: (key: string) => Phaser.Geom.Rectangle | null;
};

// Type de données d'une étape
type Step = {
  html: string;
  onEnter?: () => void;
  panelAt?: { x: number, y: number };

  advance?: 'dialog' | 'external';
  awaitRect?: {x: number, y: number, w: number, h: number};
  awaitTargetKey?: string;
  passThrough?: boolean;

  awaitSceneStart?: string | string[];
  awaitSceneWake?: string | string[];
  awaitSceneStop?: string | string[];
  awaitSceneSleep?: string | string[];
};

// Scène de tutoriel
export class TutorialScene extends Phaser.Scene {
  private done = false;
  private stepIndex = 0;
  private steps: Step[] = [];

  private dialogReady = false;
  private dialogLocked = false;
  private awaitClickHandler?: (p: Phaser.Input.Pointer) => void;

  private sceneOffs: Array<() => void> = [];

  // Réfs UI
  private panel!: Phaser.GameObjects.Rectangle;
  private profileBg!: Phaser.GameObjects.Rectangle;
  private profilePic!: Phaser.GameObjects.Image;
  private textBg!: Phaser.GameObjects.Rectangle;
  private dom!: Phaser.GameObjects.DOMElement;
  private nextIcon!: Phaser.GameObjects.Sprite;
  private skipBtn!: Phaser.GameObjects.Text;

  // Surbrillance
  private veil!: Phaser.GameObjects.Graphics;
  private holeG?: Phaser.GameObjects.Graphics;
  private holeMask?: Phaser.Display.Masks.GeometryMask;
  private holeBorder?: Phaser.GameObjects.Graphics;
  private borderTween?: Phaser.Tweens.Tween;
  private holeBorders: Phaser.GameObjects.Graphics[] = [];
  private borderTweensArr: Phaser.Tweens.Tween[] = [];

  // Data passé par la scène qui appelle le tutoriel
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

    // Panneau / éléments
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

    // HTML dans la zone texte
    const PADDING = 12;
    const area = this.textBg.getBounds();
    this.dom = this.add.dom(area.x + PADDING, area.y + PADDING)
      .createFromHTML(this.makeHTML('…'))
      .setOrigin(0, 0).setDepth(4);

    // Click n’importe où dans la zone pour aller au step suivant
    this.dom.addListener('click');
    this.dom.on('click', (e: any) => {
      const el = e.target as HTMLElement;

      // Skip via lien dans le HTML
      const clickable = el.closest('[data-action]') as HTMLElement | null;
      if (clickable?.getAttribute('data-action') === 'skip') {
        e.preventDefault();
        this.finish('skipped');
        return;
      }

      if (this.dialogLocked) return;

      this.nextStep();
    });

    // clique sur le fond textuel
    this.textBg.on('pointerup', () => {
      if (this.dialogLocked) return;
      this.nextStep();
    });

    // Anim “next”
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

    this.skipBtn = this.add.text(40, 650, 'Passer le tutoriel',
      { fontFamily: 'romet', fontSize: '24px', color: '#F7A03C' }
    )
    .setDepth(5)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => this.finish('skipped'));

    this.dialogReady = true;

    // Etapes, dans l'ordre
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
          `L'interface de jeu se compose de 2 zones.<br>
          <br>
          La zone de <span style="color:#F7A03C;">gauche</span> est la zone "informations".<br>
          Cet interface est visible durant toute la partie.<br>`,
        onEnter: () => {
          this.makeHoleAt(0, 0, 285, 720);
        }
      },
      {
        html:
          `La zone de <span style="color:#F7A03C;">droite</span> est la carte de jeu.<br>
          <br>
          C'est ici que tu vas pouvoir choisir le chemin que tu comptes emprunter afin d'aller le plus
          loin possible.<br>`,
        onEnter: () => {
          this.makeHoleAt(285, 0, 995, 720);
        }
      },
      {
        html:
          `Pour commencer,<br> nous allons voir ensemble à quoi correspondent les 
          informations visibles sur <span style="color:#F7A03C;">l'interface</span> informations.`,
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
          `Enfin, tu peux voir ici <span style="color:#F7A03C;">l'argent</span> que tu possèdes.<br> Actuellement, tu as 0 pièce d'<span style="color:#F7A03C;">or</span>.`,
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
          `La carte se compose de chemins. Chaque chemin est parsemé d'<span style="color:#F7A03C;">evenements</span>.
          L'icone ici indique que cet <span style="color:#F7A03C;">evenement</span> ci est un combat simple.<br>`,
          onEnter: () => {
            this.makeHoleAt(551, 515, 65, 65);
          },
          panelAt: { x: 775, y: 225 },
      },
      {
        html:
          `Il existe plusieurs types d'<span style="color:#F7A03C;">evenements</span>.<br>
          Je te laisses le plaisir de découvrir les autres par toi-meme !`,
          onEnter: () => {
          },
          panelAt: { x: 775, y: 225 },
      },
      {
        html:
          `Pour commencer la partie, il te suffit de cliquer sur une des 3 premières cases <span style="color:#F7A03C;">evenement</span>.<br>`,
          advance: 'external',
          passThrough: true,
          awaitTargetKey: 'evenement',
          awaitSceneStart: 'MainScene',
          onEnter: () => {
            this.makeHoles([
              new Phaser.Geom.Rectangle(551, 515, 65, 65),
              new Phaser.Geom.Rectangle(755, 515, 65, 65),
              new Phaser.Geom.Rectangle(959, 515, 65, 65),
            ])
          },
          panelAt: { x: 775, y: 225 },
      },
      {
        html:
          `Nous voici dans le coeur du jeu, les combats !<br>
          <br>
          Depuis cet interface, tu peux voir en <span style="color:#F7A03C;">surbrillance</span> ta main actuelle.`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoleAt(300, 545, 975, 150);
          },
          panelAt: { x: 775, y: 225 },
      },
      {
        html:
          `Ici, tu peux trier ta main par <span style="color:#F7A03C;">couleur</span> ou 
          par <span style="color:#F7A03C;">valeur</span>. <br>
          <br>
          Tu peux essayer dès maintenant si tu veux !`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoleAt(1050, 517.5, 155, 30);
          },
          panelAt: { x: 775, y: 225 },
      },
      {
        html:
          `Là, tu peux voir le <span style="color:#F7A03C;">monstre</span> que tu affrontes actuellement.<br>
          Le but du jeu est de réaliser des mains de poker afin de lui infliger des dégâts et de le mettre hors d'état de nuir.`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoleAt(1030, 195, 215, 225);
          },
          panelAt: { x: 775, y: 600 },
      },
      {
        html:
          `Tu peux voir ici sa <span style="color:#F7A03C;">barre de vie</span>.<br>
          Lorsque celle-ci tombe à 0, le monstre devient "out".<br>
          Ce qui te laisse passer à la suite.`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoleAt(1050, 174, 160, 30);
          },
          panelAt: { x: 775, y: 600 },
      },
      {
        html:
          `Pour finir avec le monstre, voici son <span style="color:#F7A03C;">intention</span>.<br>
          La plupart des monstres annoncent à l'avance se qu'ils s'apprêtent à faire.<br>
          A toi d'analyser ce que le pictogramme signifie et adapter ta stratégie en fonction !`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoleAt(980, 170, 75, 35);
          },
          panelAt: { x: 775, y: 600 },
      },
      {
        html:
          `Voici la table. C'est ici que tu peux y placer tes <span style="color:#F7A03C;">cartes</span>.<br>
          Tu peux poser jusqu'à 5 cartes sur la table. Le but est d'en faire la main de poker la plus
          élevée possible avec les cartes que tu disposes dans ta main.`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoleAt(305, 285, 720, 200);
          },
          panelAt: { x: 775, y: 600 },
      },
      {
        html:
          `Le <span style="color:#F7A03C;">score</span> est ensuite calculé en temps réel 
          et affiché à gauche dans l'interface de <span style="color:#F7A03C;">score</span>.`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoles([
              new Phaser.Geom.Rectangle(305, 285, 720, 200),
              new Phaser.Geom.Rectangle(12.5, 112.5, 245, 85),
            ])
          },
          panelAt: { x: 775, y: 600 },
      },
      {
        html:
          `Une fois les cartes placées sur la table, tu peux décider de les <span style="color:#F7A03C;">jouer</span> 
          ou de les <span style="color:#F7A03C;">défausser</span>.<br>`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoleAt(1030, 412.5, 230, 55);
          },
          panelAt: { x: 775, y: 600 },
      },
      {
        html:
          `Si tu décides de les jouer, cela inflige des <span style="color:#F7A03C;">dégâts</span>
          au monstre en fonction du score de la table.<br>`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoleAt(1030, 412.5, 117.5, 55);
          },
          panelAt: { x: 775, y: 600 },
      },
      {
        html:
          `En revanche, si tu décides de les défausser, cela va mettre ces cartes dans 
          ta <span style="color:#F7A03C;">défausse</span> puis tu repioche autant de cartes que défaussées`,
          advance: 'dialog',
          onEnter: () => {
            this.makeHoleAt(1142.5, 412.5, 117.5, 55);
          },
          panelAt: { x: 775, y: 600 },
      }
    ];

    this.applyStep(this.steps[0]);

    this.input.setTopOnly(true);
  }

  // Step management
  // passe à l'étape suivante
  private nextStep() {
    if (this.done) return;

    this.clearHole();
    this.input.setTopOnly(true);

    if (this.awaitClickHandler) {
      this.input.off('pointerup', this.awaitClickHandler);
      this.awaitClickHandler = undefined;
    }
    this.sceneOffs.forEach(off => off());
    this.sceneOffs = [];

    this.stepIndex++;
    if (this.stepIndex >= this.steps.length) {
      this.finish('completed');
      return;
    }
    this.applyStep(this.steps[this.stepIndex]);
  }

  // Applique l'étape actuelle
  private applyStep(step: Step) {
    if (step.panelAt) {
      const { x, y } = step.panelAt;
      this.moveDialogTo(x, y);
    }

    const PADDING = 12;
    const a = this.textBg.getBounds();
    const el = this.dom.node as HTMLElement;
    el.style.width  = `${a.width  - PADDING * 2}px`;
    el.style.height = `${a.height - PADDING * 2}px`;
    el.innerHTML    = this.makeHTML(step.html);
    this.dom.setPosition(a.x + PADDING, a.y + PADDING);

    this.setDialogLocked(step.advance === 'external');
    this.input.setTopOnly(!(step.passThrough === true));

    const awaitRect = this.resolveAwaitRect(step);
    if (awaitRect) {
      this.awaitClickHandler = (pointer: Phaser.Input.Pointer) => {
        if (Phaser.Geom.Rectangle.Contains(awaitRect, pointer.x, pointer.y)) {
          this.input.off('pointerup', this.awaitClickHandler!);
          this.awaitClickHandler = undefined;
          this.nextStep();
        }
      };
      this.input.on('pointerup', this.awaitClickHandler);
    }

    this.bindSceneEventsForKeys(step.awaitSceneStart, Phaser.Scenes.Events.START);
    this.bindSceneEventsForKeys(step.awaitSceneWake,  Phaser.Scenes.Events.WAKE);
    this.bindSceneEventsForKeys(step.awaitSceneSleep, Phaser.Scenes.Events.SLEEP);
    this.bindSceneEventsForKeys(step.awaitSceneStop,  Phaser.Scenes.Events.SHUTDOWN);

    step.onEnter?.();
  }

  // Fonction pour "injecter" du HTML dans ma boite de dialogue
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

  // Termine la scène
  private async finish(state: 'skipped'|'completed') {
    if (this.awaitClickHandler) {
      this.input.off('pointerup', this.awaitClickHandler);
      this.awaitClickHandler = undefined;
    }
    this.sceneOffs.forEach(off => off());
    this.sceneOffs = [];

    this.done = true;
    this.clearHole();

    const token = localStorage.getItem('jwt') || localStorage.getItem('token');

    try {
      await fetch('/players/me/tutorial', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'disable', tutorialVersion: 1 }),
      });
    } catch (e) {
      console.warn('[Tuto] Sauvegarde préférence a échoué', e);
      this.game.registry.set('tutorialDone', true);
      try { localStorage.setItem('romet:tutorialDone', '1'); } catch {}
    }

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.tutData?.onComplete?.(state);
      this.scene.stop();
    });
  }

  // Tentative pour illuminer un rectangle sans avoir à le positionner
  private makeHole(rect: Phaser.Geom.Rectangle, radius: number = 12) {
    this.clearHole();

    this.holeG = this.add.graphics();
    this.holeG.fillStyle(0xffffff, 1);
    this.holeG.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
    this.holeG.setVisible(false);

    this.holeMask = new Phaser.Display.Masks.GeometryMask(this, this.holeG);
    this.holeMask.setInvertAlpha(true);
    this.veil.setMask(this.holeMask);

    this.holeBorder = this.add.graphics().setDepth(5);
    this.holeBorder.lineStyle(4, 0xffffff, 1);
    this.holeBorder.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);

    this.borderTween = this.tweens.add({
      targets: this.holeBorder,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  // Supprile la surbrillance de toute la scène
  private clearHole() {
    (this.veil as any)?.clearMask?.(true);
    this.holeMask?.destroy();
    this.holeG?.destroy();
    this.holeMask = undefined;
    this.holeG = undefined;

    // détruire toutes les bordures
    this.borderTweensArr.forEach(t => t.stop());
    this.borderTweensArr = [];

    this.holeBorders.forEach(g => g.destroy());
    this.holeBorders = [];
  }

  // Positionne la boite de dialogue
  private layoutDialogAt(x: number, y: number) {
    if (!this.dialogReady || !this.panel || !this.profileBg || !this.profilePic || !this.textBg || !this.nextIcon) {
      return;
    }

    this.panel.setPosition(x, y);
    this.profileBg.setPosition(this.panel.x - 335, this.panel.y);
    this.profilePic.setPosition(this.profileBg.x, this.profileBg.y);
    this.textBg.setPosition(this.panel.x + 100, this.panel.y);
    this.nextIcon.setPosition(this.panel.x + 395, this.panel.y + 65);

    if (this.skipBtn) this.skipBtn.setPosition(this.panel.x + 430, this.panel.y - 95);
  }

  // Déplace la boite de dialogue
  private moveDialogTo(x: number, y: number) {
    this.layoutDialogAt(x, y);
  }

  private ensureHoleMask(radiusDefault: number = 12) {
    if (this.holeG) return;

    this.holeG = this.add.graphics();
    this.holeG.fillStyle(0xffffff, 1);
    this.holeG.setVisible(false);

    this.holeMask = new Phaser.Display.Masks.GeometryMask(this, this.holeG);
    this.holeMask.setInvertAlpha(true);
    this.veil.setMask(this.holeMask);
  }

  // Ajoute une surbrillance sur un rectangle
  private addHole(rect: Phaser.Geom.Rectangle, radius: number = 12) {
    this.ensureHoleMask(radius);

    this.holeG!.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);

    const border = this.add.graphics().setDepth(5);
    border.lineStyle(4, 0xffffff, 1);
    border.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);

    const tw = this.tweens.add({
      targets: border,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    this.holeBorders.push(border);
    this.borderTweensArr.push(tw);
  }

  // Ajoute une surbrillance sur un rectangle par coordonnées
  private makeHoleAt(x: number, y: number, w: number, h: number, radius: number = 12) {
    this.addHole(new Phaser.Geom.Rectangle(x, y, w, h), radius);
  }

  // Ajoute une surbrillance sur plusieurs rectangles
  private makeHoles(rects: Phaser.Geom.Rectangle[], radius: number = 12) {
    rects.forEach(r => this.addHole(r, radius));
  }

  private resolveAwaitRect(step: Step): Phaser.Geom.Rectangle | null {
    if (step.awaitRect) {
      const {x,y,w,h} = step.awaitRect;
      return new Phaser.Geom.Rectangle(x,y,w,h);
    }
    if (step.awaitTargetKey && this.tutData.getTargetBounds) {
      const r = this.tutData.getTargetBounds(step.awaitTargetKey);
      return r ?? null;
    }
    return null;
  }

  // Bloque le "skip" via la boite de dialogue
  private setDialogLocked(locked: boolean) {
    this.dialogLocked = locked;

    const node = this.dom?.node as HTMLElement | undefined;
    if (node) {
      node.style.pointerEvents = locked ? 'auto' : 'auto'; 
      node.style.cursor = locked ? 'default' : 'pointer';
    }

    if (this.textBg) {
      if (locked) this.textBg.disableInteractive();
      else this.textBg.setInteractive({ useHandCursor: true });
    }
  }

  private toArray<T>(v?: T | T[]): T[] {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }

  // Skip une étape du tutoriel en passant par un autre bind
  private bindSingleSceneSysEvent(sceneKey: string, eventName: string) {
    let sc: Phaser.Scene | undefined;

    try {
      sc = this.scene.get(sceneKey) as Phaser.Scene;
    } catch {
      sc = undefined;
    }
    if (!sc) return;

    const sysEv = sc.sys.events as Phaser.Events.EventEmitter;
    const handler = () => {
      this.sceneOffs.forEach(off => off());
      this.sceneOffs = [];
      if (this.awaitClickHandler) {
        this.input.off('pointerup', this.awaitClickHandler);
        this.awaitClickHandler = undefined;
      }
      this.nextStep();
    };

    sysEv.on(eventName, handler);
    this.sceneOffs.push(() => sysEv.off(eventName, handler));
  }

  // Permet de passer l'étape du tutoriel via une touche de clavier
  private bindSceneEventsForKeys(keys: string | string[] | undefined, eventName: string) {
    this.toArray(keys).forEach(k => this.bindSingleSceneSysEvent(k, eventName));
  }
}