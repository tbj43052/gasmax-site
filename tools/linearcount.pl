# Linear bar and counter on one 3.3 s clock; every integer 0..100 gets shown. Delimiter ~.
s~\@property --slp\{syntax:'<integer>';inherits:false;initial-value:1\}~\@property --slp{syntax:'<integer>';inherits:false;initial-value:0}~;
s~\.site-loader\{--sl-dur:3s;~.site-loader{--sl-dur:3.3s;~;
s~animation:slFill var\(--sl-dur\) cubic-bezier\(\.22,\.61,\.36,1\) forwards~animation:slFill var(--sl-dur) linear forwards~g;
s~animation:slCount var\(--sl-dur\) cubic-bezier\(\.22,\.61,\.36,1\) forwards~animation:slCount var(--sl-dur) linear forwards~;
s~\@keyframes slCount\{from\{--slp:1\}to\{--slp:100\}\}~\@keyframes slCount{from{--slp:0}to{--slp:100}}~;
s~const DUR = reduced \? 800 : 3000;~const DUR = reduced ? 800 : 3300;~;
s~    const ease = t => 1 - Math\.pow\(1 - t, 2\.4\);\n    const count = \(now\) => \{ const k = Math\.min\(1, \(now - t0\) / DUR\); pct\.textContent = Math\.max\(1, Math\.round\(1 \+ 99 \* ease\(k\)\)\) \+ '%'; if \(k < 1 \&\& !finished\) requestAnimationFrame\(count\); \};~    const count = (now) => { const k = Math.min(1, (now - t0) / DUR); pct.textContent = Math.min(100, Math.floor(100 * k)) + '%'; if (k < 1 \&\& !finished) requestAnimationFrame(count); };~;
