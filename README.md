# ERC721Attachable

ERC721Attachable is an extension to the ERC721 standard where a ERC721Attachable token can be `attach`ed to a `host` ERC721 token. 

When an ERC721Attachable token attaches to a host, the ERC721Attachable token no longer belongs to the wallet address but is bind to the host ERC721 token. In this state, if the host token is transferred, the attached token moves with the token and cannot transfer itself away from the host. In fact, most of the mutable operations are restricted in this state. 

It can be `detach`ed from the host, at which point, it restores all mutable operations such as `approve`/`transferFrom`, and can be treated as normal ERC721 token.

Internally, it flips between two states: attached and detached. When it's detached from any hosts, it acts as a normal ERC721 token. When it's attached to a host, the internal states, `_owners` and `_balances`, lose track of the latest update. It keeps track of the owners in `_hosts` when it's attached. This allows `ownerOf` method to return the correct owner (the owner of the host). It burns the token when it attaches to a host to lose the record keeping and mints the same token when it's detached.

_WARNING: This code has not been comprehensively tested or audited. The author is not responsible for any loss of funds. Meanwhile, please open an issue or a PR if you find any bugs or vulnerabilities._

# Motivation
An extension like `ERC721Attachable` enables tokenizing `attributes` that are, today, assigned to ERC721 tokens as metadata. Tokenizing attributes enable decoupling and composing them across many ERC721 tokens. Attributes can be decoupled from a token and traded in open markets. An attribute in one project can be composed in another project.