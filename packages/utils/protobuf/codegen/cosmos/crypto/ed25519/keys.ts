import { BinaryReader, BinaryWriter } from "../../../binary";
import { bytesFromBase64, base64FromBytes } from "../../../helpers";
/**
 * PubKey is an ed25519 public key for handling Tendermint keys in SDK.
 * It's needed for Any serialization and SDK compatibility.
 * It must not be used in a non Tendermint key context because it doesn't implement
 * ADR-28. Nevertheless, you will like to use ed25519 in app user level
 * then you must create a new proto message and follow ADR-28 for Address construction.
 */
export interface PubKey {
  key: Uint8Array;
}
export interface PubKeyProtoMsg {
  typeUrl: "/cosmos.crypto.ed25519.PubKey";
  value: Uint8Array;
}
/**
 * PubKey is an ed25519 public key for handling Tendermint keys in SDK.
 * It's needed for Any serialization and SDK compatibility.
 * It must not be used in a non Tendermint key context because it doesn't implement
 * ADR-28. Nevertheless, you will like to use ed25519 in app user level
 * then you must create a new proto message and follow ADR-28 for Address construction.
 */
export interface PubKeyAmino {
  key?: string;
}
export interface PubKeyAminoMsg {
  type: "tendermint/PubKeyEd25519";
  value: PubKeyAmino;
}
/**
 * PubKey is an ed25519 public key for handling Tendermint keys in SDK.
 * It's needed for Any serialization and SDK compatibility.
 * It must not be used in a non Tendermint key context because it doesn't implement
 * ADR-28. Nevertheless, you will like to use ed25519 in app user level
 * then you must create a new proto message and follow ADR-28 for Address construction.
 */
export interface PubKeySDKType {
  key: Uint8Array;
}
/**
 * PrivKey defines a ed25519 private key.
 * NOTE: ed25519 keys must not be used in SDK apps except in a tendermint validator context.
 */
export interface PrivKey {
  key: Uint8Array;
}
export interface PrivKeyProtoMsg {
  typeUrl: "/cosmos.crypto.ed25519.PrivKey";
  value: Uint8Array;
}
/**
 * PrivKey defines a ed25519 private key.
 * NOTE: ed25519 keys must not be used in SDK apps except in a tendermint validator context.
 */
export interface PrivKeyAmino {
  key?: string;
}
export interface PrivKeyAminoMsg {
  type: "tendermint/PrivKeyEd25519";
  value: PrivKeyAmino;
}
/**
 * PrivKey defines a ed25519 private key.
 * NOTE: ed25519 keys must not be used in SDK apps except in a tendermint validator context.
 */
export interface PrivKeySDKType {
  key: Uint8Array;
}
function createBasePubKey(): PubKey {
  return {
    key: new Uint8Array()
  };
}
export const PubKey = {
  typeUrl: "/cosmos.crypto.ed25519.PubKey",
  encode(message: PubKey, writer: BinaryWriter = BinaryWriter.create()): BinaryWriter {
    if (message.key.length !== 0) {
      writer.uint32(10).bytes(message.key);
    }
    return writer;
  },
  decode(input: BinaryReader | Uint8Array, length?: number, useInterfaces: boolean = false): PubKey {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePubKey();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromPartial(object: Partial<PubKey>): PubKey {
    const message = createBasePubKey();
    message.key = object.key ?? new Uint8Array();
    return message;
  },
  fromAmino(object: PubKeyAmino): PubKey {
    const message = createBasePubKey();
    if (object.key !== undefined && object.key !== null) {
      message.key = bytesFromBase64(object.key);
    }
    return message;
  },
  toAmino(message: PubKey, useInterfaces: boolean = false): PubKeyAmino {
    const obj: any = {};
    obj.key = message.key ? base64FromBytes(message.key) : undefined;
    return obj;
  },
  fromAminoMsg(object: PubKeyAminoMsg): PubKey {
    return PubKey.fromAmino(object.value);
  },
  toAminoMsg(message: PubKey, useInterfaces: boolean = false): PubKeyAminoMsg {
    return {
      type: "tendermint/PubKeyEd25519",
      value: PubKey.toAmino(message, useInterfaces)
    };
  },
  fromProtoMsg(message: PubKeyProtoMsg, useInterfaces: boolean = false): PubKey {
    return PubKey.decode(message.value, undefined, useInterfaces);
  },
  toProto(message: PubKey): Uint8Array {
    return PubKey.encode(message).finish();
  },
  toProtoMsg(message: PubKey): PubKeyProtoMsg {
    return {
      typeUrl: "/cosmos.crypto.ed25519.PubKey",
      value: PubKey.encode(message).finish()
    };
  }
};
function createBasePrivKey(): PrivKey {
  return {
    key: new Uint8Array()
  };
}
export const PrivKey = {
  typeUrl: "/cosmos.crypto.ed25519.PrivKey",
  encode(message: PrivKey, writer: BinaryWriter = BinaryWriter.create()): BinaryWriter {
    if (message.key.length !== 0) {
      writer.uint32(10).bytes(message.key);
    }
    return writer;
  },
  decode(input: BinaryReader | Uint8Array, length?: number, useInterfaces: boolean = false): PrivKey {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePrivKey();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromPartial(object: Partial<PrivKey>): PrivKey {
    const message = createBasePrivKey();
    message.key = object.key ?? new Uint8Array();
    return message;
  },
  fromAmino(object: PrivKeyAmino): PrivKey {
    const message = createBasePrivKey();
    if (object.key !== undefined && object.key !== null) {
      message.key = bytesFromBase64(object.key);
    }
    return message;
  },
  toAmino(message: PrivKey, useInterfaces: boolean = false): PrivKeyAmino {
    const obj: any = {};
    obj.key = message.key ? base64FromBytes(message.key) : undefined;
    return obj;
  },
  fromAminoMsg(object: PrivKeyAminoMsg): PrivKey {
    return PrivKey.fromAmino(object.value);
  },
  toAminoMsg(message: PrivKey, useInterfaces: boolean = false): PrivKeyAminoMsg {
    return {
      type: "tendermint/PrivKeyEd25519",
      value: PrivKey.toAmino(message, useInterfaces)
    };
  },
  fromProtoMsg(message: PrivKeyProtoMsg, useInterfaces: boolean = false): PrivKey {
    return PrivKey.decode(message.value, undefined, useInterfaces);
  },
  toProto(message: PrivKey): Uint8Array {
    return PrivKey.encode(message).finish();
  },
  toProtoMsg(message: PrivKey): PrivKeyProtoMsg {
    return {
      typeUrl: "/cosmos.crypto.ed25519.PrivKey",
      value: PrivKey.encode(message).finish()
    };
  }
};