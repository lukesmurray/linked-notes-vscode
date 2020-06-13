# Terminology

## Citations and Cite Proc

<dl>
  <dt>Citation</dt>
  <dd>
    A citation is a list of one or more bibliographic references in the text. A citation has a list of Citation Items in its <code>citationItems</code> field.<br>
    For example <code>[@einstein, @bose]</code> is a single citation which contains two citation items <code>@einstein</code> and <code>@bose</code>.
  </dd> 
  <dt>Bibliographic Item</dt>
  <dd>
    A Bibliographic Item is the data found in a CSL JSON (citation style language json) bibliographic export for a single reference. The only two properties required on a bibliographic item are the <code>id</code> and <code>type</code>. The <code>id</code> is used to generate the citation key.
  </dd>
  <dt>Citation Item</dt>
  <dd>
    A Citation Item is the data associated with a single bibliographic reference in the text. There may be multiple citation items in a citation. Each citation item references a single Bibliographic Item in its <code>itemData</code> field. The citation item also contains metadata related to formatting such as a prefix and suffix or locators.
  </dd>
  <dt>CitationId</dt>
  <dd>
    A CitationId is an id associated with a Citation by the citation processor.
  </dd>
  <dt>Citation Key</dt>
  <dd>
    A citation key is a unique string used to identify a bibliographic reference in a bibliography export. A citation key is created by prefixing the bibliographic item's id with an <code>@</code> symbol.
  </dd>
  <dt>File Reference</dt>
  <dd>A bidirectional link from a node in a remark AST to a file.</dd>
</dl>
