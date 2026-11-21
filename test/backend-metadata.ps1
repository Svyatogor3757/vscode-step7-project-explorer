param([string]$AssemblyPath)
$ErrorActionPreference='Stop'
$assembly=[Reflection.Assembly]::LoadFrom($AssemblyPath)
$method=$assembly.GetType('Step7Project.SymbolMetadata').GetMethod('HasUnsupportedAttributes')
$root=Join-Path $env:TEMP ('SPB-metadata-test-'+[guid]::NewGuid().ToString('N'))
[void](New-Item -ItemType Directory $root)
function Fixture([string]$name,[string]$attribute,[string]$value,[bool]$deleted=$false,[int]$count=1) {
 $fields=@(@{Name='_SKZ';Length=24},@{Name='_COMMENT';Length=80})
 if($attribute){$fields+=@{Name=$attribute;Length=24}}
 $header=32+$fields.Count*32+1;$record=1
 foreach($field in $fields){$record+=$field.Length}
 $bytes=New-Object byte[] ($header+$record*$count+1);$bytes[0]=3
 [BitConverter]::GetBytes([uint32]$count).CopyTo($bytes,4)
 [BitConverter]::GetBytes([uint16]$header).CopyTo($bytes,8)
 [BitConverter]::GetBytes([uint16]$record).CopyTo($bytes,10)
 for($i=0;$i -lt $fields.Count;$i++){
  [Text.Encoding]::ASCII.GetBytes($fields[$i].Name).CopyTo($bytes,32+$i*32)
  $bytes[32+$i*32+11]=67;$bytes[32+$i*32+16]=$fields[$i].Length
 }
 $bytes[$header-1]=13;$bytes[$bytes.Length-1]=26
 if($count){for($i=$header;$i -lt $header+$record;$i++){$bytes[$i]=32};if($deleted){$bytes[$header]=42};if($attribute){[Text.Encoding]::ASCII.GetBytes($value).CopyTo($bytes,$header+1+24+80)}}
 $file=Join-Path $root ($name+'.dbf');[IO.File]::WriteAllBytes($file,$bytes);return $file
}
$passed=0
try {
 foreach($case in @(
  @{Name='metadata_plain';Attribute='';Value='';Expected=$false},
  @{Name='metadata_wincc_reference';Attribute='_MD';Value='WinCC';Expected=$true},
  @{Name='metadata_unknown_field';Attribute='_FUTURE';Value='X';Expected=$true},
  @{Name='metadata_zero_flag';Attribute='_MDFLAG';Value='0';Expected=$false},
  @{Name='metadata_deleted_row';Attribute='_MD';Value='WinCC';Deleted=$true;Expected=$false},
  @{Name='metadata_empty_table';Attribute='_MD';Value='';Count=0;Expected=$false}
 )){
  $count=1;if($case.ContainsKey('Count')){$count=$case.Count}
  $file=Fixture $case.Name $case.Attribute $case.Value ([bool]$case.Deleted) $count
  $actual=[bool]$method.Invoke($null,[object[]]@([string]$file))
  if($actual -ne $case.Expected){throw ($case.Name+': unexpected result '+$actual)}
  Write-Output ('PASS '+$case.Name);$passed++
 }
 $file=Join-Path $root 'truncated.dbf';[IO.File]::WriteAllBytes($file,[byte[]]@(3,0,0))
 $rejected=$false;try{[void]$method.Invoke($null,[object[]]@([string]$file))}catch{if($_.Exception.GetBaseException() -is [IO.InvalidDataException]){$rejected=$true}else{throw}}
 if(!$rejected){throw 'Truncated DBF was accepted'}
 Write-Output 'PASS metadata_truncated_rejected';$passed++
 Write-Output ('Passed: '+$passed+', Failed: 0, Skipped: 0')
}finally{Remove-Item -LiteralPath $root -Recurse -Force}
