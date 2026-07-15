/** Inline scripts for diagram pages — theme-aware Mermaid + zoom controls. */
export const MERMAID_SETUP_SCRIPTS = `<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
(function () {
  function diagramTheme() {
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) {
      return {
        theme: 'base',
        themeVariables: {
          darkMode: true,
          background: '#1a2332',
          fontSize: '15px',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          primaryColor: '#243044',
          primaryTextColor: '#e7ecf3',
          primaryBorderColor: '#5b9fd4',
          secondaryColor: '#2a3648',
          secondaryTextColor: '#e7ecf3',
          tertiaryColor: '#1a2332',
          tertiaryTextColor: '#e7ecf3',
          lineColor: '#c5d0dc',
          textColor: '#e7ecf3',
          mainBkg: '#243044',
          nodeBorder: '#5b9fd4',
          clusterBkg: '#243044',
          clusterBorder: '#5b9fd4',
          titleColor: '#e7ecf3',
          edgeLabelBackground: '#243044',
          actorBkg: '#243044',
          actorBorder: '#5b9fd4',
          actorTextColor: '#e7ecf3',
          actorLineColor: '#c5d0dc',
          signalColor: '#e7ecf3',
          signalTextColor: '#e7ecf3',
          labelBoxBkgColor: '#243044',
          labelBoxBorderColor: '#5b9fd4',
          labelTextColor: '#e7ecf3',
          loopTextColor: '#e7ecf3',
          noteBkgColor: '#2a3648',
          noteTextColor: '#e7ecf3',
          noteBorderColor: '#5b9fd4',
          activationBkgColor: '#2a3648',
          activationBorderColor: '#5b9fd4',
          sequenceNumberColor: '#9aa7b8',
        },
      };
    }

    return {
      theme: 'base',
      themeVariables: {
        darkMode: false,
        background: '#ffffff',
        fontSize: '15px',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        primaryColor: '#f6f8fb',
        primaryTextColor: '#1a2332',
        primaryBorderColor: '#1d6fb8',
        secondaryColor: '#eef3f8',
        secondaryTextColor: '#1a2332',
        lineColor: '#5a6b7d',
        textColor: '#1a2332',
        mainBkg: '#f6f8fb',
        nodeBorder: '#1d6fb8',
        clusterBkg: '#f6f8fb',
        clusterBorder: '#d8e0ea',
        titleColor: '#1a2332',
        edgeLabelBackground: '#ffffff',
        actorBkg: '#f6f8fb',
        actorBorder: '#1d6fb8',
        actorTextColor: '#1a2332',
        actorLineColor: '#5a6b7d',
        signalColor: '#1a2332',
        signalTextColor: '#1a2332',
        labelBoxBkgColor: '#f6f8fb',
        labelBoxBorderColor: '#1d6fb8',
        labelTextColor: '#1a2332',
        loopTextColor: '#1a2332',
        noteBkgColor: '#eef3f8',
        noteTextColor: '#1a2332',
        noteBorderColor: '#1d6fb8',
        activationBkgColor: '#eef3f8',
        activationBorderColor: '#1d6fb8',
        sequenceNumberColor: '#5a6b7d',
      },
    };
  }

  var themeConfig = diagramTheme();
  mermaid.initialize(Object.assign({
    startOnLoad: true,
    flowchart: { useMaxWidth: false, htmlLabels: true },
    sequence: {
      useMaxWidth: false,
      messageFontSize: 15,
      actorFontSize: 15,
      noteFontSize: 14,
      messageAlign: 'center',
    },
    er: { useMaxWidth: false },
  }, themeConfig));
})();
</script>
<script>
(function () {
  document.querySelectorAll('[data-diagram-viewer]').forEach(function (viewer) {
    var stage = viewer.querySelector('.diagram-stage');
    var levelEl = viewer.querySelector('[data-zoom-level]');
    var scale = 1;
    var min = 0.5;
    var max = 3;
    var step = 0.15;

    function target() {
      return stage.querySelector('svg') || stage.querySelector('.mermaid');
    }

    function applyScale() {
      var el = target();
      if (!el) return;
      el.style.transform = 'scale(' + scale + ')';
      el.style.transformOrigin = 'top left';
      levelEl.textContent = Math.round(scale * 100) + '%';
    }

    function fitWidth() {
      var svg = stage.querySelector('svg');
      if (!svg) return;
      var stageWidth = stage.clientWidth - 24;
      var svgWidth = svg.getBoundingClientRect().width / scale;
      if (svgWidth <= 0) return;
      scale = Math.min(max, Math.max(min, stageWidth / svgWidth));
      applyScale();
    }

    viewer.querySelector('[data-zoom-in]').addEventListener('click', function () {
      scale = Math.min(max, scale + step);
      applyScale();
    });
    viewer.querySelector('[data-zoom-out]').addEventListener('click', function () {
      scale = Math.max(min, scale - step);
      applyScale();
    });
    viewer.querySelector('[data-zoom-reset]').addEventListener('click', function () {
      scale = 1;
      applyScale();
      stage.scrollLeft = 0;
      stage.scrollTop = 0;
    });
    viewer.querySelector('[data-zoom-fit]').addEventListener('click', fitWidth);

    stage.addEventListener('wheel', function (event) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      scale = event.deltaY < 0
        ? Math.min(max, scale + step)
        : Math.max(min, scale - step);
      applyScale();
    }, { passive: false });

    var observer = new MutationObserver(function () {
      if (stage.querySelector('svg')) {
        fitWidth();
        observer.disconnect();
      }
    });
    observer.observe(stage, { childList: true, subtree: true });
  });
})();
</script>`;
