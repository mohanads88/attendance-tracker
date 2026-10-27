"""Build public/templates/attendance.docx from the office's Word sample.

Usage: python3 scripts/build_word_template.py <sample.docx>

Keeps the sample's header (logo, "محضر اجتماع"), footer (page x of y), fonts
and table design, and replaces the attendance rows with placeholders that the
app fills in the browser (src/wordExport.js):

  {{MEETING_INFO}}  meeting number / day / date / time line (removed if empty)
  {{NUM}} {{NAME}} {{POSITION}} {{STATUS}}   one row per invitee
  {{XNUM}} {{XNAME}}                          extra-attendees table (removed if none)
"""
import re, sys, zipfile, os

src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), "..", "public", "templates", "attendance.docx")

with zipfile.ZipFile(src) as z:
    files = {n: z.read(n) for n in z.namelist()}
doc = files["word/document.xml"].decode("utf-8")

head = doc[: doc.index("<w:body>") + len("<w:body>")]
sect = doc[doc.rindex("<w:sectPr") :]
body = doc[len(head) : doc.rindex("<w:sectPr")]


def top_level(xml):
    """Split body XML into top-level <w:p>/<w:tbl> elements."""
    out, i = [], 0
    while i < len(xml):
        m = re.match(r"<(w:p|w:tbl)[ >]", xml[i:])
        if not m:
            i = xml.find("<", i + 1)
            if i < 0:
                break
            continue
        tag, depth, k = m.group(1), 0, i
        while True:
            o = xml.find("<" + tag, k)
            c = xml.find("</" + tag + ">", k)
            if o != -1 and o < c and re.match("<" + tag + r"[ >]", xml[o:]):
                depth, k = depth + 1, o + 1
            else:
                depth, k = depth - 1, c + len(tag) + 3
                if depth == 0:
                    break
        out.append((tag, xml[i:k]))
        i = k
    return out


els = top_level(body)
tables = [x for t, x in els if t == "w:tbl"]
title_tbl, main_tbl = tables[0], tables[-1]
lead_p = els[0][1] if els[0][0] == "w:p" else "<w:p/>"


def unfloat(tbl):
    # floating tables overlap when content grows; make them flow with the text
    tbl = re.sub(r"<w:tblpPr[^>]*/>", "", tbl)
    return re.sub(r"<w:tblOverlap[^>]*/>", "", tbl)


def set_text(p_xml, text):
    """Replace all runs' text in a paragraph with one value (keeps first run's format)."""
    runs = re.findall(r"<w:r[ >].*?</w:r>", p_xml, re.S)
    first = re.sub(r"<w:t[^>]*>[^<]*</w:t>", f'<w:t xml:space="preserve">{text}</w:t>', runs[0], count=1)
    p_xml = p_xml.replace(runs[0], first, 1)
    for r in runs[1:]:
        p_xml = p_xml.replace(r, "", 1)
    return p_xml


title_tbl = unfloat(title_tbl)
main_tbl = unfloat(main_tbl)
rows = re.findall(r"<w:tr[ >].*?</w:tr>", main_tbl, re.S)
hdr, sample = rows[0], rows[1]
hdr = hdr.replace("<w:trPr>", "<w:trPr><w:tblHeader/>", 1)  # repeat header on each page

cells = re.findall(r"<w:tc>.*?</w:tc>", sample, re.S)
# number cell: plain centred text instead of the list numbering
num_cell = re.sub(r"<w:numPr>.*?</w:numPr>|<w:pStyle[^>]*/>|<w:ind[^>]*/>", "", cells[0])
num_cell = num_cell.replace('<w:jc w:val="right"/>', '<w:jc w:val="center"/>')
run = re.search(r"<w:r[ >].*?</w:r>", cells[3], re.S).group(0)
num_cell = num_cell.replace("</w:pPr></w:p>", "</w:pPr>" + re.sub(r"<w:t[^>]*>[^<]*</w:t>", "<w:t>{{NUM}}</w:t>", run) + "</w:p>")
name_cell = set_text(cells[1], "{{NAME}}")
pos_cell = set_text(cells[2], "{{POSITION}}")
stat_cell = set_text(cells[3], "{{STATUS}}").replace("</w:tcBorders></w:tcPr>", '</w:tcBorders><w:vAlign w:val="center"/></w:tcPr>')
row_tpl = sample[: sample.index("<w:tc>")] + num_cell + name_cell + pos_cell + stat_cell + "</w:tr>"

main_new = main_tbl[: main_tbl.index(rows[0])] + hdr + row_tpl + main_tbl[main_tbl.rindex("</w:tr>") + 7 :]

# extra attendees: same design, two columns (م، الاسم كما ظهر في اللقطة)
wide = "10347"
x_title = title_tbl.replace("الحضور", "الحضور الإضافي (من خارج قائمة المدعوين)")
hcells = re.findall(r"<w:tc>.*?</w:tc>", hdr, re.S)
x_hdr = hdr[: hdr.index("<w:tc>")] + hcells[0] + set_text(re.sub(r'w:w="3599"', f'w:w="{wide}"', hcells[1]), "الاسم كما ظهر في اللقطة") + "</w:tr>"
x_row = sample[: sample.index("<w:tc>")] + num_cell.replace("{{NUM}}", "{{XNUM}}") + re.sub(r'w:w="3599"', f'w:w="{wide}"', name_cell).replace("{{NAME}}", "{{XNAME}}") + "</w:tr>"
x_tbl = main_new[: main_new.index(hdr)] + x_hdr + x_row + "</w:tbl>"
x_tbl = re.sub(r"<w:tblGrid>.*?</w:tblGrid>", f'<w:tblGrid><w:gridCol w:w="560"/><w:gridCol w:w="{wide}"/></w:tblGrid>', x_tbl, flags=re.S)

# meeting info line, styled like the table text, centred
info_p = (
    '<w:p><w:pPr><w:bidi/><w:spacing w:before="120" w:after="120"/><w:jc w:val="center"/></w:pPr>'
    '<w:r><w:rPr><w:rFonts w:ascii="Sakkal Majalla" w:hAnsi="Sakkal Majalla" w:cs="Sakkal Majalla"/>'
    '<w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/><w:rtl/></w:rPr>'
    '<w:t xml:space="preserve">{{MEETING_INFO}}</w:t></w:r></w:p>'
)
gap = '<w:p><w:pPr><w:bidi/><w:spacing w:after="0"/></w:pPr></w:p>'

new_body = (
    lead_p + title_tbl + info_p + gap + main_new
    + '<!--EXTRA_START-->' + gap + gap + x_title + gap + x_tbl + '<!--EXTRA_END-->'
    + gap
)
files["word/document.xml"] = (head + new_body + sect).encode("utf-8")

# drop the sample's custom metadata
for n in list(files):
    if n.startswith("customXml/"):
        del files[n]
ct = files["[Content_Types].xml"].decode("utf-8")
ct = re.sub(r'<Override PartName="/customXml/[^>]*/>', "", ct)
files["[Content_Types].xml"] = ct.encode("utf-8")
rels = files["word/_rels/document.xml.rels"].decode("utf-8")
rels = re.sub(r'<Relationship [^>]*Target="\.\./customXml/[^>]*/>', "", rels)
files["word/_rels/document.xml.rels"] = rels.encode("utf-8")

os.makedirs(os.path.dirname(out), exist_ok=True)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for n, data in files.items():
        z.writestr(n, data)
print("wrote", os.path.normpath(out), os.path.getsize(out), "bytes")
