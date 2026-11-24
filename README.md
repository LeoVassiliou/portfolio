# Leo Vassiliou | Portfolio

Personal portfolio at [leovassiliou.co.uk](https://leovassiliou.co.uk). I'm a second-year Computer Science student at the University of Hertfordshire, looking for a 2027/28 software engineering placement.

![LeoOS, the desktop-style portfolio](docs/leoos-desktop.png)

## LeoOS: the portfolio is a little desktop

The default design is **LeoOS**, a desktop that runs entirely in the browser. Everything I'd normally link to opens in a window instead:

- **CV**: rendered in-page from the same data as the PDF, with download and print
- **Knowitball**: my football games platform, playable in a window (pick any of the six games)
- **TPE**: the [Theism Probability Engine](TPE/README.md), running live in its own window
- **GitHub**: a live list of my repositories from the GitHub API
- **Terminal**: a working command line (`help`, `cv`, `play`, `tpe`, `github`, `sudo hire leo`)
- Draggable, resizable, minimisable and maximisable windows with a taskbar; on phones each window goes full screen

The site has three more designs (Kickoff, Headline and Orbit), switchable from the button in the corner. Your choice is remembered.

## What's here

| Path | What it is |
| --- | --- |
| [`index.html`](index.html) | The whole site: one self-contained file of HTML, CSS and vanilla JavaScript. No build step, no framework. All content lives in one `D` object near the top. |
| [`TPE/`](TPE/) | **Theism Probability Engine**, an interactive probability tool. See [its README](TPE/README.md). |
| `Leo-Vassiliou-CV.pdf` | My current CV. |
| `CNAME` | Custom domain. |

## Featured projects

- **Knowitball** ([knowitball.co.uk](https://knowitball.co.uk)): a browser-based football games platform with accounts, player profiles and six games, in beta.
- **Theism Probability Engine** ([/TPE](https://leovassiliou.co.uk/TPE/)): rate the premises of classic arguments and see how they should move your confidence. A full model plus a streamlined, unit-tested one.
- **Unity / C# games**: six years of independent game development.

## Run it locally

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

(Serving it, rather than opening the file directly, lets the TPE window load.)

## Contact

[leov2007@hotmail.com](mailto:leov2007@hotmail.com) | [LinkedIn](https://www.linkedin.com/in/leovassiliou) | [GitHub](https://github.com/LeoVassiliou)
