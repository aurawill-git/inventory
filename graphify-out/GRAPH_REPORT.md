# Graph Report - Inventory app  (2026-05-06)

## Corpus Check
- 145 files · ~456,948 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1492 nodes · 2583 edges · 30 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 468 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 126 edges
2. `error()` - 83 edges
3. `XMLEditor` - 61 edges
4. `BaseSchemaValidator` - 40 edges
5. `search()` - 33 edges
6. `Document` - 32 edges
7. `create()` - 32 edges
8. `log()` - 30 edges
9. `run()` - 29 edges
10. `_pop_flag()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `GET()`  [INFERRED]
  skills\xlsx\xlsx.py → src\app\api\settings\route.ts
- `load_config()` --calls--> `GET()`  [INFERRED]
  skills\aminer-academic-search\scripts\aminer.py → src\app\api\settings\route.ts
- `invoke()` --calls--> `GET()`  [INFERRED]
  skills\aminer-academic-search\scripts\aminer.py → src\app\api\settings\route.ts
- `main()` --calls--> `invoke()`  [INFERRED]
  skills\web-reader\scripts\web-reader.ts → skills\aminer-academic-search\scripts\aminer.py
- `main()` --calls--> `invoke()`  [INFERRED]
  skills\web-search\scripts\web_search.ts → skills\aminer-academic-search\scripts\aminer.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (187): _best_font_for_char(), check_file(), _classify_field(), _classify_lines(), cmd(), code_sanitize(), content_sanitize(), content_sanitize_cli() (+179 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (67): _condense_xml(), Document, DocxXMLEditor, _generate_hex_id(), _generate_rsid(), _pack_document(), Add people.xml relationship to document.xml.rels if not already present., Initialize with required RSID and optional author.          Args:             xm (+59 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (109): generate_gift_card(), aggregate_results(), calculate_stats(), generate_benchmark(), generate_markdown(), load_run_results(), main(), Aggregate run results into summary statistics.      Returns run_summary with sta (+101 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (75): GET(), handleAddItem(), handleCellEdit(), handleDelete(), newQuickRow(), seedIfEmpty(), submitClosingRows(), submitInwardRows() (+67 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (81): load(), _assign_floating_meta(), audit_cascade_palette(), audit_palette(), _auto_assign_grid_areas(), calculate_layout(), _cascade_to_css(), _cascade_to_reportlab() (+73 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (73): align_header(), align_title(), _apply(), apply_chart_colors(), apply_pie_colors(), border_header(), border_total(), copy_style() (+65 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (42): BaseSchemaValidator, BaseSchemaValidator, Base validator with common validation logic for document files., Run all validation checks and return True if all pass., Validate that all XML files are well-formed., Base validator with common validation logic for document files., Validate that namespace prefixes in Ignorable attributes are declared., Validate that specific IDs are unique according to OOXML requirements. (+34 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (61): add_toc_placeholders(), _detect_toc_styles(), _ensure_hyperlink_style(), _ensure_toc_styles(), _extract_headings_from_docx(), _fix_fld_char_structure(), _fix_heading_outline_levels(), _fix_update_fields() (+53 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (52): generate_visual(), get_script_path(), main(), Get the path to the appropriate generation script., Generate a single visual using the appropriate tool., condense_xml(), main(), pack_document() (+44 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (33): _collect_shapes(), _collect_shapes_from_slide(), _detect_overlaps(), extract_text_inventory(), _is_cjk(), _is_valid_shape(), _layout_font_size(), main() (+25 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (36): check_missing_glyphs(), font_check(), check_blank_pages(), check_colors(), check_content_fill_ratio(), check_cover_bleed(), check_font_embedding(), check_formula_overflow() (+28 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (24): generate_html(), main(), Generate HTML report from loop output data. If auto_refresh is True, adds a meta, _call_zai(), improve_description(), main(), Run `z-ai chat -p` with the prompt and return the text response., Call z-ai to improve the description based on eval results. (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (19): CharacterProfile, ConsistencyChecker, ConsistencyIssue, main(), Load all character profiles from the project, Check character mentions in content for inconsistencies, Represents a consistency issue found in the story, Check for inconsistent character relationships (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (35): auto_fit_columns(), Auto-fit column widths based on DATA content (not header).     Headers that exce, _aggregate(), cell_ref(), _check_charts(), cmd(), cmd_audit(), cmd_chart_verify() (+27 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (18): main(), Extract character names from explicit character markers, Find mentions of known characters in content, Parse a chapter/scene file for timeline events, Analyze entire project and build timeline, Represents a single event in the story timeline, Group events by their timepoint, Group events by character appearance (+10 more)

### Community 15 - "Community 15"
Cohesion: 0.1
Nodes (27): HTMLParser, _best_generic(), check_html(), check_pdf(), check_tex(), _contrast_ratio(), _extract_color(), _has_generic() (+19 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (18): BaseHTTPRequestHandler, build_run(), embed_file(), find_runs(), _find_runs_recursive(), generate_html(), get_mime_type(), _kill_port() (+10 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (21): buildPrompts(), callZAI(), charBudget(), chooseDurationMinutes(), countNonWsChars(), ensureSilenceWav(), joinWavsWave(), main() (+13 more)

### Community 18 - "Community 18"
Cohesion: 0.23
Nodes (16): addBackground(), addElements(), applyEmphasisFont(), calculateWidthCompensation(), checkCharCount(), checkElementBounds(), checkMinFontSize(), checkTextOverlaps() (+8 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (8): main(), Generate detailed word-level differences using git word diff., Validator for tracked changes in Word documents., Generate word diff using git with character-level precision., Remove tracked changes authored by Z.AI from the XML root., Main validation method that returns True if valid, False otherwise., Extract text content from Word XML, preserving paragraph structure.          Emp, RedliningValidator

### Community 21 - "Community 21"
Cohesion: 0.28
Nodes (7): main(), package_skill(), Check if a path should be excluded from packaging., Package a skill folder into a .skill file.      Args:         skill_path: Path t, should_exclude(), Basic validation of a skill, validate_skill()

### Community 24 - "Community 24"
Cohesion: 0.38
Nodes (6): check_library(), list_examples(), prune_oldest(), List all blog examples sorted by date (oldest first)., Check library status and recommend pruning if needed., Remove the oldest examples to bring library under limit.

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 28 - "Community 28"
Cohesion: 0.47
Nodes (5): main(), pretty_print_xml(), Unpack an Office file into a directory and pretty-print all XML files., Pretty-print a single XML file in place., unpack_document()

### Community 30 - "Community 30"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (2): handleKeyPress(), sendMessage()

### Community 36 - "Community 36"
Cohesion: 0.83
Nodes (3): createSystemMessage(), createUserMessage(), generateMessageId()

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (1): # TODO: Add actual script logic here

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (2): get_cyber_divination_data(), 赛博算命核心算法 v2.1     - 输出适配 HTML 前端渲染

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (2): main(), safe_filename()

## Knowledge Gaps
- **418 isolated node(s):** `List all blog examples sorted by date (oldest first).`, `Check library status and recommend pruning if needed.`, `Remove the oldest examples to bring library under limit.`, `Extract headings from a DOCX file for auto-mode TOC generation.      Args:`, `Add placeholder TOC entries to a DOCX file (in-place replacement).      Args:` (+413 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 27`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (5 nodes): `carousel.tsx`, `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (4 nodes): `frontend.tsx`, `handleJoin()`, `handleKeyPress()`, `sendMessage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (3 nodes): `main()`, `# TODO: Add actual script logic here`, `example.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (3 nodes): `get_cyber_divination_data()`, `赛博算命核心算法 v2.1     - 输出适配 HTML 前端渲染`, `lunar_python.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (3 nodes): `main()`, `safe_filename()`, `generate_html.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Community 2` to `Community 0`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 19`, `Community 21`?**
  _High betweenness centrality (0.445) - this node is a cross-community bridge._
- **Why does `error()` connect `Community 3` to `Community 0`, `Community 2`, `Community 4`, `Community 8`, `Community 10`, `Community 17`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `XMLEditor` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Are the 125 inferred relationships involving `GET()` (e.g. with `load_config()` and `invoke()`) actually correct?**
  _`GET()` has 125 INFERRED edges - model-reasoned connections that need verification._
- **Are the 49 inferred relationships involving `error()` (e.g. with `main()` and `main()`) actually correct?**
  _`error()` has 49 INFERRED edges - model-reasoned connections that need verification._
- **Are the 49 inferred relationships involving `XMLEditor` (e.g. with `DocxXMLEditor` and `Document`) actually correct?**
  _`XMLEditor` has 49 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `BaseSchemaValidator` (e.g. with `DOCXSchemaValidator` and `Validator for Word document XML files against XSD schemas.`) actually correct?**
  _`BaseSchemaValidator` has 20 INFERRED edges - model-reasoned connections that need verification._