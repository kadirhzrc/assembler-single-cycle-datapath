const fs = require("fs");
const parse = require("csv-parse");
var binary = require("s-binary");

const _opcodes = {
  AND: "0010",
  ADD: "0000",
  LD: "1010",
  ST: "1011",
  ANDI: "0011",
  ADDI: "0001",
  CMP: "0100",
  JUMP: "1100",
  JE: "0101",
  JA: "0110",
  JB: "0111",
  JBE: "1000",
  JAE: "1001"
};

const _registers = {
  R0: "000",
  R1: "001",
  R2: "010",
  R3: "011",
  R4: "100",
  R5: "101",
  R6: "110",
  R7: "111",
};

fs.writeFileSync(`./AssemblerOutput.hex`, "v2.0 raw\n", "utf-8", function(err) {
  if (err) {
    response.send("failed to save");
  }
});

let asmData = [];

fs.createReadStream("instructions.txt")
  .pipe(parse({ delimiter: " " }))
  .on("data", function(csvrow) {
    asmData.push(csvrow);
  })
  .on("end", function() {
    // console.log(asmData);

    for (let i = 0; i < asmData.length; i++) {
      let opcode = _opcodes[asmData[i][0]];
      let binaryValue;

      let registers = asmData[i][1].split(",");

      if (registers.length === 3) {
        if (asmData[i][0] == "ADDI" || asmData[i][0] == "ANDI") {
          // special condition for both cases

          let positiveValue =
            parseInt(registers[2]) >= 0
              ? parseInt(registers[2])
              : -parseInt(registers[2]);
          let Imm = binary.toBinary(positiveValue, 6);
          let negImm = binary.complement(Imm);
          let result = parseInt(registers[2]) > 0 ? Imm : negImm;

          binaryValue =
            opcode +
            _registers[registers[0]] +
            _registers[registers[1]] +
            result;
        } else {
          binaryValue =
            opcode +
            _registers[registers[0]] +
            _registers[registers[1]] +
			"000"					 +
            _registers[registers[2]];
        }
      } else if (registers.length === 2) {
        if (asmData[i][0] == "CMP") {
          binaryValue =
            opcode  +
			"000"   +
            _registers[registers[0]] +
			"000"	+
            _registers[registers[1]] 
        } else {
          // LD or ST
          // FIXME: unsigned olacak bunlar OK
          let positiveValue =
            parseInt(registers[1]) >= 0
              ? parseInt(registers[1])
              : -parseInt(registers[1]);
          let Imm = binary.toBinary(positiveValue, 9);

          binaryValue = opcode + _registers[registers[0]] + Imm;
        }
      } else {
        // if only 1 register
        let positiveValue =
          parseInt(registers[0]) >= 0
            ? parseInt(registers[0])
            : -parseInt(registers[0]);
        let Imm = binary.toBinary(positiveValue, 12);
        let negImm = binary.complement(Imm);
        let result = parseInt(registers[0]) > 0 ? Imm : negImm;
        binaryValue = opcode + result;
      }
      console.log(
        "binaryValue",
        binaryValue,
        binary.toHex(binaryValue),
        binary.toHex(binaryValue).length
      );

      let hexValue = binary.toHex(binaryValue);
      if (hexValue.length == 2) {
        hexValue = `00${hexValue}`;
      } else if (hexValue.length == 3) {
        hexValue = `0${hexValue}`;
      }
      fs.appendFileSync(`./AssemblerOutput.hex`, `${hexValue}\n`, function(
        err
      ) {
        if (err) return console.log(err);
      });
    }
  });
